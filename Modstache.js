// Modstache
// Mustache placeholder replacement and reactive model/dom assignment
//
// http://www.modstache.com
//
// MIT License
//
// Copyright (c) 2020 - John Warner

/*jshint esversion: 9 */

var Modstache = function() {

    'use strict';

    let version = '1.1.0';
  
    let exports = { version: version };
    let defaultOptions = {
        removeStache: false, // remove staching attribute in element
        escape: true, // prevent script insertion
        translate: null, // map model to element
        alwaysSetTranslatedProperty: false, // ensure element has attribute defined
        reactive: true, // changes to model are reflected in elements
        stache: '{}', // staching attribute name
        mustacheInArrayTemplate: true, // check for mustache entries in array template
        events: { // events filled in by attribute or with default option
            oninit: null,
            onremoved: null,
            onupdated: null
        }
    };
    const DisableReactiveAssignment = '-';
    const EnableReactiveAssignment = '+';
    const PlaceholderTag = 'slot';
    const Directives = {
        if: '{if}',
        root: '{root}', // change root data object for descendants
        oninit: '{oninit}',
        // onremoved: '{onremoved}', // not working
        // onupdated: '{onupdated}', // not working
        template: '{template}',
        nonreactive: '{nonreactive}'
    };
    let setterBucket = null; // used to keep track of setters for current array fragment
    let reactiveSetters = new WeakMap(); // used to keep track of element reactive setter functions by object and property name

    function GetPropertyDetail(root, obj, path, baseArray, baseObject) {
        var detail = {
            base: (baseObject) ? baseObject : root,
            root: root,
            parent: obj,
            propertyName: '',
            descriptor: null,
            array: baseArray,
            path: path
        };
        var current;
        let missing = false;
        path.split('.').forEach((o) => {
            if (missing)
                return;

            detail.propertyName = o;
            if (typeof current !== 'undefined') {
                detail.parent = current;
                current = current[o];
            }
            else {
                detail.parent = obj;
                current = obj[o];
            }

            if (typeof (current) === 'undefined')
                missing = true;
        });

        if (!missing) {
            detail.descriptor = Object.getOwnPropertyDescriptor(detail.parent, detail.propertyName);

            return detail;
        }
        else
            return null;
    }
    
    function EscapeForHtml(s) {
        if (typeof(s) === 'string') {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        else
            return '';
    }

    function GetAllOptionSettings(options) {
        //return Object.assign({...defaultOptions}, options); // not supported by edge
        let settings = Object.assign({}, defaultOptions);
        options.events = Object.assign({}, defaultOptions.events); // copy default events;
        return Object.assign(settings, options); // make copy of options with all options
    }

    const fragment = (html) => { var tpl = document.createElement('template'); tpl.innerHTML = html; return tpl.content;  };
    const isPlainObject = (o) => Object.prototype.toString.call(o) === '[object Object]';
    const isFunction = (f) => typeof f === 'function';
    const GetStacheContext = (e, propDetail, options) => {
        return {
            element: e,
            root: propDetail.root,
            parent: propDetail.parent,
            key: propDetail.propertyName,
            array: propDetail.array,
            events: options.events,
            base: propDetail.base
        };
    };
    const GetStacheAttribute = (o) => o.stache.replace('{','\\{').replace('}','\\}');

    function Fill(template, data, options = defaultOptions) {
        if (typeof template === "string")
            template = fragment(FillHTML(template, data, options));

        return FillDOM(template, data, options);
    }

    function FillHTML(template, data, options = defaultOptions, baseArray = null, baseObject = null) {
        options = GetAllOptionSettings(options);
        baseObject = baseObject || data;

         // Check if the template is a string or a function
        template = isFunction(template) ? template() : template;
        if (['string', 'number'].indexOf(typeof template) === -1) throw 'Please provide a valid template';
    
        // If no data, return template as-is
        if (!data) return template;
    
        // Replace our curly braces with data
        template = template.replace(/\{\{([^}]+)\}\}/g, function (match) {
    
            // Remove the wrapping curly braces
            match = match.slice(2, -2);
    
            // Get the value
            let propDetail = null;
            if (match.startsWith('{base}.')) {
                match = match.replace('{base}.', '');
                propDetail = GetPropertyDetail(data, baseObject, match, baseArray, baseObject);
            }
            else {
                propDetail = GetPropertyDetail(data, data, match, baseArray, baseObject);
            }
            if (propDetail != null) {
                let value = propDetail.parent[propDetail.propertyName];
                if (typeof (val) === 'function')
                    value = value();
                if (options.escape)
                    return EscapeForHtml(value + '');
                else
                    return value + '';
            }
            else {
                return '{{' + match + '}}';
            }
        });
    
        return template;
    
    }

    function FillDOM(dom, data, options = defaultOptions, baseArray = null, baseObject = null) {
        options = GetAllOptionSettings(options);

        let stacheSelector = GetStacheAttribute(options);
        var stached = [...dom.querySelectorAll("["+stacheSelector+"]")]; // getStached(dom,options.stacheAttribute);
        let translate = options.translate;
        let processed = [];
        let stachedDOMroot = (dom instanceof DocumentFragment) ? null : dom.getAttribute(options.stache);

        baseObject = baseObject || data;
        if (stachedDOMroot !== null) {
            stached.unshift(dom);
        }
        stached.forEach((e) => {
            let activeOptions = GetAllOptionSettings(options);
            let status = { removed: false };
            let deferred = false;

            if (!processed.includes(e)) {
                let assignments = e.getAttribute(activeOptions.stache).split(';');
                let restoreReactive = null;

                assignments.some((assignment) => {
                    if (restoreReactive !== null) {
                        activeOptions.reactive = restoreReactive;
                        restoreReactive = null;
                    }
                    if (assignment === Directives.nonreactive) {
                        activeOptions.reactive = false; // disable reactive assignment for remaining assignments
                        return false;
                    }

                    var target = assignment.split(':');
                    var attribute = null;
                    var ss;
                    var eventUpdateProperty = null;

                    if (target.length > 1) {
                        attribute = target[0];
                        ss = target[1];
                    }
                    else {
                        ss = assignment;
                    }
                    let lastSSChar = ss[ss.length-1];
                    if (lastSSChar == DisableReactiveAssignment) {
                        restoreReactive = activeOptions.reactive;
                        activeOptions.reactive = false; // disable reactive assignment for this property only
                        ss = ss.slice(0,-1);
                    }
                    else if (lastSSChar == EnableReactiveAssignment) {
                        restoreReactive = activeOptions.reactive;
                        activeOptions.reactive = true; // enable reactive assignment for this property only
                        ss = ss.slice(0,-1);
                    }
                    if (ss.includes('>')) {
                        let updateFields = ss.split('>');
                        eventUpdateProperty = updateFields[0];
                        ss = updateFields[1];
                    }
                    var propDetail = null;
                    if (ss.startsWith('{base}.')) {
                        ss = ss.replace('{base}.', '');
                        propDetail = GetPropertyDetail(data, baseObject, ss, baseArray, baseObject);
                    }
                    else {
                        propDetail = GetPropertyDetail(data, data, ss, baseArray, baseObject);
                    }
                    if (propDetail != null) {
                        var value = propDetail.parent[propDetail.propertyName]; // GetValue(data, ss);
                        if (typeof value !== 'undefined') {
                            if (attribute && attribute[0] === '{') { // special directive
                                ProcessDirective(attribute, e, value, propDetail, activeOptions, processed, status);
                            }
                            else {
                                if (attribute == null && translate && translate.hasOwnProperty(ss))
                                    attribute = translate[ss];

                                    if (eventUpdateProperty !== null) {
                                        updatePropertyOnEvent(attribute, e, eventUpdateProperty, ss, propDetail, activeOptions);
                                    }
                                    else {
                                        processed.push(...FillElementWithData(e, attribute, value, propDetail, activeOptions, status));
                                    }
                            }
                         }
                    }
                    else { // value not found in object - process appropriately
                        if (attribute && attribute[0] === '{') { // special directive
                            ProcessDirective(attribute, e, null, null, activeOptions, processed, status);
                            deferred = true;
                        }
                    }

                    return status.removed;
                });
                if (!deferred) {
                    if (activeOptions.removeStache)
                        e.removeAttribute(activeOptions.stache);
                    if (activeOptions.events.oninit) {
                        activeOptions.events.oninit(e);
                    }
                }
            }
        });

        return dom;
    }

    function ProcessDirective(directive, dom, value, propDetail, options, processed, status) {
        switch (directive) {
            case Directives.if:
                processIfDirective(dom, value, propDetail, options, processed, status);
                break;
            case Directives.root:
                processRootDirective(dom, value, propDetail, options, processed, status);
                break;
            case Directives.oninit:
                processOnInitDirective(dom, value, propDetail, options, processed, status);
                break;
            // case Directives.onremoved:
            //     processOnRemovedDirective(dom, value, propDetail, options, processed, status);
            //     break;
            // case Directives.onupdated:
            //     processOnUpdatedDirective(dom, value, propDetail, options, processed, status);
            //     break;
        }
    }

    function processIfDirective(dom, value, propDetail, options, processed, status) {
        let shown = GetDataValue(value, dom, GetStacheContext(dom,propDetail,options));
        if (!shown) { // remove dom and 
            RemoveElement(dom, processed, options);
            status.removed = true;
       }
    }

    function processRootDirective(dom, value, propDetail, options, processed, status) {
        let stached = [...dom.querySelectorAll("["+GetStacheAttribute(options)+"]")]; // needs to be before processing in case stached attribute is removed
        if (value !== null) {
            let root = GetDataValue(value, dom, GetStacheContext(dom,propDetail,options));

            [...dom.children].forEach((e) => {
                FillDOM(e, root, options, null, propDetail.base);
            });
        }

        processed.push(...stached);
    }

    function processOnInitDirective(dom, value, propDetail, options, processed, status) {
        var info = GetStacheContext(dom,propDetail,options);
        options.events.oninit = (e) => { value(info, e); };
    }

    // function processOnRemovedDirective(dom, value, propDetail, options, processed, status) {
    //     var info = GetStacheContext(dom,propDetail,options);
    //     options.events.onremoved = (e) => { value(info, e); };
    // }

    // function processOnUpdatedDirective(dom, value, propDetail, options, processed, status) {
    //     var info = GetStacheContext(dom,propDetail,options);
    //     options.events.onupdated = (e) => { value(info, e); };
    // }

    function RemoveElement(dom, processed, options) {
        let stacheSelector = GetStacheAttribute(options);
        var stached = [...dom.querySelectorAll("["+stacheSelector+"]")]; // getStached(dom,options.stacheAttribute);

        if (dom.parentNode)
            dom.parentNode.removeChild(dom);
        processed.push(...stached);
    }

    function FillElementWithData(element, attribute, data, propDetail, options, status) {
        var info = GetStacheContext(element,propDetail,options);
        var value = GetDataValue(data, element, info);
        let processed = [element];
        let stacheSelector = GetStacheAttribute(options);

        if (isPlainObject(value)) {
            //FillElementWithObject(element, value, options);
            AssignTextOrObject(element, value, propDetail, info, options);
        }
        else if (Array.isArray(value)) {
            processed.push(...element.querySelectorAll("["+stacheSelector+"]")); // children have been processed
            CreateAndFillElements(element, value, propDetail, options, processed, status);
            status.removed = true; // remove processing of the rest of the dom controlled by the array
        }
        else {
            if (attribute) {
                // if (element.hasAttribute(attribute))
                //     AssignAttribute(element, attribute, value, propDetail, info, options);
                // else {
                //     var elemProperty = GetPropertyDetail(element, element, attribute, null);
                //     AssignProperty(elemProperty, value, propDetail, info, options);
                // }
                // property prioritized over attribute
                let elemProperty = GetPropertyDetail(element, element, attribute, null);
                if (elemProperty !== null || !element.hasAttribute(attribute)) {
                    AssignProperty(elemProperty, value, propDetail, info, options, element);
                }
                else if (element.hasAttribute(attribute)) {
                    AssignAttribute(element, attribute, value, propDetail, info, options);
                }
           }
            else if (attribute === '')
                AssignNothing(element, propDetail, info, options);  // useful for external initialization of element
            else
                AssignTextOrObject(element, value, propDetail, info, options);
        }

        return processed;
    }

    function FillElementWithObject(element, data, options) {
        let translate = options.translate;

        for (var key in data) {
            let tkey = key;
            let translated = false;
            var propDetail = GetPropertyDetail(data, data, key);
            var info = GetStacheContext(element,propDetail,options);
            let dataValue = GetDataValue(data[key], element, info);

            if (translate && translate.hasOwnProperty(key)) {
                tkey = translate[key];
                translated = true;
            }
            var elemProperty = GetPropertyDetail(element, element, tkey, null);

            if (elemProperty !== null) {
                AssignProperty(elemProperty, dataValue, propDetail, info, options, element);
            }
            else if (element.hasAttribute(tkey)) {
                AssignAttribute(element, tkey, dataValue, propDetail, info, options);
            }
            else if (translated && options.alwaysSetTranslatedProperty) {
                element[tkey] = dataValue;
                elemProperty = GetPropertyDetail(element, element, tkey, null);
                AssignProperty(elemProperty, dataValue, propDetail, info, options, element);
            }
        }
    }

    function updatePropertyOnEvent(event, element, attribute, modelName, propDetail, options) {
        let processed = [element];
        let updater;
        var info = GetStacheContext(element,propDetail,options);
        let settings = Object.assign({}, options);
        let propFunction = isFunction(propDetail.parent[propDetail.propertyName]);
       
        if (attribute in element) {
            updater = () => {
                let value = element[attribute];
                if (propFunction)
                    propDetail.parent[propDetail.propertyName](value, info);
                else
                    propDetail.parent[propDetail.propertyName] = value; 
            };
        }
        else {
            updater = () => { 
                let value = element.getAttribute(attribute);
                if (propFunction)
                    propDetail.parent[propDetail.propertyName](value, info);
                else
                    propDetail.parent[propDetail.propertyName] = value; 
            };
        }

        element[event] = updater;
        //AssignProperty(element, event, updater, propDetail, info, settings);

        return processed;
    }

    function CreateAndFillElements(element, models, propDetail, options, processed, status) {
        let template = element.cloneNode(true);
        let parent = element.parentNode;
        let createdElements = [];
        let fragment = new DocumentFragment();
        var proxy;
        var templateSpecifier;

        // check to see if template is specified
        let assignments = element.getAttribute(options.stache).split(';');
        let arrayAssignment = -1;
        for (let i=0; i < assignments.length; i++) {
            let assignment = assignments[i];
            let specifier = assignment.split(':');
            if (specifier.length > 1 && specifier[0].length > 1 && specifier[0][0] === '{') {
                if (specifier[0] === Directives.template) {
                    templateSpecifier =  specifier[1];
                }
                else {
                    let directiveDetail = GetPropertyDetail(propDetail.root, propDetail.parent, specifier[1], models);
                    if (directiveDetail) {
                        let value = directiveDetail.parent[directiveDetail.propertyName];
                        ProcessDirective(specifier[0], element, value, directiveDetail, options, processed, status);                 
                    }
                }
            }
            else if (specifier[0] == propDetail.path) {
                arrayAssignment = i;
            }
        }

        // remove array assignment from template in case of same name key in array objects
        // if (arrayAssignment >= 0) {
        //     assignments.splice(arrayAssignment, 1);
        //     let stached = assignments.join(';');
        //     if (false && stached === '') {
        //         template.removeAttribute(options.stache);
        //     }
        //     else {
        //         for (let attr = 0; attr < template.attributes.length; attr++) { // can't use setAttribute
        //             if (template.attributes[attr].name === options.stache) {
        //                 template.attributes[attr].value = assignments.join(';');
        //             }
        //         }
        //     }
        // }

        if (options.mustacheInArrayTemplate && !templateSpecifier) {
            let usesMustache = /\{\{([^}]+)\}\}/g.test(template.outerHTML); // check for Mustache usage in template
            if (usesMustache)
                template = template.outerHTML;
        }

        let context = GetFilledContext(template, templateSpecifier, parent, createdElements, models, options, propDetail.base);

        // replace with proxy before filling in case model functions need to change model
        if (options.reactive) {
            propDetail.parent[propDetail.propertyName] = proxy = GetFilledProxy(context); // repace array with proxy
            context.proxy = proxy;
        }

        models.forEach((m) => {
            let dom = GetTemplate(context, m);
            createdElements.push(CreateFilledElement(proxy, dom, m, fragment, null, options, context.base));
        });

        parent.insertBefore(fragment, element);

        if (createdElements.length === 0) { // empty array so insert placeholder
            context.placeholder = document.createElement(PlaceholderTag); // template element won't affect layout
            parent.insertBefore(context.placeholder, element);
        }

        parent.removeChild(element);
    }

    function CreateFilledElement(modelArray, template, model, parent, nextElement, options, base) {
        setterBucket = new Set();

        if (typeof template === "string") {
            template = fragment(FillHTML(template, model, options, modelArray, base));
        }
        else {
            template = template.cloneNode(true);
        }

        let e = FillDOM(template, model, options, modelArray, base);
        if (nextElement) {
            parent.insertBefore(e, nextElement);
            e = nextElement.previousSibling;
        }
        else {
            parent.appendChild(e);
            e = parent.lastChild;
        }

        let result = { e: e, s: setterBucket };
        setterBucket = null; // fragment processing is finished - so don't accumulate more setters

        return result;
    }

    function GetTemplate(context, model) {
        let defaultTemplate = context.template;
        let specifier = context.templateSpecifier;

        if (specifier) {
            let detail = GetPropertyDetail(model, model, specifier, null);
            if (detail) {
                let t = detail.parent[detail.propertyName];
                if (t instanceof DocumentFragment || t instanceof String)
                    return t;
            }
        }

        return defaultTemplate;
    }

    function GetFilledContext(template, templateSpecifier, parent, createdElements, models, options, base) {
        return {
            template: template,
            templateSpecifier : templateSpecifier,
            parent: parent,
            elements: createdElements,
            models: models,
            options: options,
            base: base,
            proxy: null, // real proxy to be added if reactive is enabled
            placeholder: null // placeholder element for empty list
        };
    }

    const deleteElements = (context, start, deleteCount) => {
        if (isNaN(deleteCount))
            deleteCount = context.elements.length;
        else if (deleteCount <= 0)
            return; // don't delete
        let end = Math.min(start+deleteCount, context.elements.length);

        if (start === 0 && end > 0 && end === context.elements.length) { // add placeholder
            context.placeholder = context.placeholder || document.createElement(PlaceholderTag);
            context.parent.insertBefore(context.placeholder, context.elements[0].e);
        }

        for (let i=start; i<end; i++) {
            context.parent.removeChild(context.elements[i].e);
            RemoveReactiveAssignments(context.elements[i].s);
        }
        context.elements.splice(start, deleteCount);
    };

    const insertElements = (context, start, models) => {
        if (models.length > 0) {
            let beforeElement = (context.elements.length === 0) ? 
                context.placeholder : 
                (start < context.elements.length) ? context.elements[start].e : context.elements[context.elements.length-1].e.nextElementSibling;
            let newElements = [];
            let fragment = new DocumentFragment();

            models.forEach((m) => {
                let dom = GetTemplate(context, m);
                newElements.push(CreateFilledElement(context.proxy, dom, m, fragment, null, context.options, context.base));
            });

            if (beforeElement)
                context.parent.insertBefore(fragment, beforeElement);
            else
                context.parent.appendChild(fragment);
            
            if (beforeElement && beforeElement === context.placeholder)
                context.parent.removeChild(beforeElement); // clear placeholder
            context.elements.splice(start,0,...newElements);
        }
    };
    const push = (context) => function (...models)  {
        insertElements(context, context.models.length, models);
        return context.models.push(...models);
    };
    const unshift = (context) => function (...models) {
        insertElements(context, 0, models);
        return context.models.unshift(...models);
    };
    const splice = (context) => function (start, deleteCount, ...models) {
        start = (start < 0) ? Math.max(0, context.models.length-start) : Math.min(start, context.models.length);
        deleteElements(context, start, deleteCount);
        insertElements(context, start, models);
        return context.models.splice(...arguments);
    };
    const pop = (context) => function () {
        deleteElements(context, context.models.length-1, 1);
        const el = context.models.pop(...arguments);
        return el;
    };
    const shift = (context) => function () {
        deleteElements(context, 0, 1);
        const el = context.models.shift(...arguments);
        return el;
    };
    
    function GetFilledProxy(context) {
        let modifiers = {
            push: push(context),
            unshift: unshift(context),
            splice: splice(context),
            pop: pop(context),
            shift: shift(context)
        };
        let handler = {
            get: function(target, property) {
                const val = target[property];
                if (typeof val === 'function') {
                    switch(property) {
                        case 'push': return modifiers.push;
                        case 'unshift': return modifiers.unshift;
                        case 'splice': return modifiers.splice;
                        case 'pop': return modifiers.pop;
                        case 'shift': return modifiers.shift;
                        default: return val.bind(target);
                    }
                }

                return val;
            },
            set: function(target, property, value, receiver) {
                if (!isNaN(property)) { // replacing setting specific index
                    modifiers.splice(property, 1, value);
                }
                if (property ==='length') {
                    if (target.length > value) { // array reduced in size
                        modifiers.splice(value);
                    }
                }
                target[property] = value;
                return true;
            }
        };

        return new Proxy(context.models, handler);
    }

    function GetDataValue(data, element, stacheInfo) {
        return (isFunction(data)) ? data(stacheInfo, element, stacheInfo.parent) : data;
    }

    function SetDefaultOptions(options) {
        defaultOptions = GetAllOptionSettings(options);
        return Object.assign({},defaultOptions); // return a copy of the options
    }

    function AssignAttribute(element, attribute, value, propDetail, info, options) {
        element.setAttribute(attribute, value);
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { 
                v= GetDataValue(v, element, info); 
                element.setAttribute(attribute, v); 
                return v; }, element);
        }
    }

    function AssignProperty(elementProp, value, propDetail, info, options, element) {
        elementProp.parent[elementProp.propertyName] = value;
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { 
                v = GetDataValue(v, elementProp.root, info); 
                elementProp.parent[elementProp.propertyName] =  v;
                // if (options.events.onupdated) options.events.onupdated(elementProp.root);
                return v; }, element);
        }
    }

    function AssignNothing(element, propDetail, info, options) {
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { 
                v = GetDataValue(v, element, info); 
                return v; }, element);
        }
    }

    function AssignTextOrObject(element, value, propDetail, info, options) {
        if (isPlainObject(value)) {
            FillElementWithObject(element, value, options);
        }
        else {
            element.textContent = value;
        }
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { 
                v = GetDataValue(v, element, info); 
                if (isPlainObject(v)) {
                    FillElementWithObject(element, v, options);
                }
                else {
                    element.textContent = v;
                }
                return v; }, element);
        }
    }

    function ChangeSetter(propDetail, setter, element) {
        let set = propDetail.descriptor.set;
        let get = propDetail.descriptor.get;
        let currentValue = propDetail.parent[propDetail.propertyName];
        let parentPropertySetters = null;
        let setters = new Set();

        if (!reactiveSetters.has(propDetail.parent)) {
            parentPropertySetters = new Map();
            reactiveSetters.set(propDetail.parent, parentPropertySetters);
        }
        else {
            parentPropertySetters = reactiveSetters.get(propDetail.parent);
        }

        if (!parentPropertySetters.has(propDetail.propertyName)) {
            AddDescriptorSetter(setters, setter, element);

            let descriptor = {
                get: (isFunction(get)) ? get : () => currentValue,
                set: (isFunction(set)) ? 
                        (v) => { currentValue = v; setters.forEach((s) => s(v) ); set(v); } : 
                        (v) => { currentValue = v; setters.forEach((s) => s(v)); },
                configurable: propDetail.descriptor.configurable,
                enumerable: propDetail.descriptor.enumerable
            };
            Object.defineProperty(propDetail.parent, propDetail.propertyName, descriptor);

            parentPropertySetters.set(propDetail.propertyName, setters);
        }
        else {
            setters = parentPropertySetters.get(propDetail.propertyName);
            AddDescriptorSetter(setters, setter, element);
        }

        if (setterBucket !== null) {
            setterBucket.add({ p: setters, s: setter });
        }
    }

    function AddDescriptorSetter(setters, setter, element) {
         setters.add(setter);
    }

    function RemoveReactiveAssignments(setters) {
        setters.forEach((descriptor) => {
            let propertySetters = descriptor.p;
            propertySetters.delete(descriptor.s);
        });
        setters.clear();
    }

    exports.fill = Fill;
    exports.fillHTML = FillHTML;
    exports.fillDOM = FillDOM;
    exports.options = SetDefaultOptions;
    exports.removeReactions = RemoveReactiveAssignments;
 
    return exports;
}();

var _M_ = Modstache;