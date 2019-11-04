// SStache
// Simple mustache placeholder replacement
// Slightly modified from placeholder.js
// Thank you Chris Ferdinandi at https://vanillajstoolkit.com/helpers/placeholders/
//
var $$tache = function() {

    var version = '0.6.0';
  
    var exports = { version: version };
    var defaultOptions = {
        removess: false,
        escape: true,
        translate: null,
        alwaysSetTranslatedProperty: false,
        reactive: true
    };

    function GetValue(obj, path) {
        var current;
        let missing = false;
        path.split('.').forEach((o) => {
            if (missing)
                return;

            current = (typeof current !== 'undefined') ? current[o] : obj[o];
            if (typeof (current) === 'undefined')
                missing = true;
        });
            
        return current;
    }

    function GetPropertyDetail(obj, path) {
        var detail = { parent: obj, propertyName: '', descriptor: null };
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

    function GetValue(obj, path) {
        var current;
        let missing = false;
        path.split('.').forEach((o) => {
            if (missing)
                return;

            current = (typeof current !== 'undefined') ? current[o] : obj[o];
            if (typeof (current) === 'undefined')
                missing = true;
        });
            
        return current;
    }
    
    function EscapeForHtml(s) {
        if (typeof(s) === 'string') {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        else
            return '';
    }

    function GetAllOptionSettings(options) {
        return Object.assign({...defaultOptions}, options); // make copy of options with all options
    }

    const fragment = (html) => { var tpl = document.createElement('template'); tpl.innerHTML = html; return tpl.content;  };
    const isPlainObject = (o) => Object.prototype.toString.call(o) === '[object Object]';
    const isFunction = (f) => typeof f === 'function';

    function Fill(template, data, options = defaultOptions) {
        if (typeof template === "string")
            template = fragment(FillHTML(template, data, options));

        return FillDOM(template, data, options);
    }

    function FillHTML(template, data, options = defaultOptions) {
        options = GetAllOptionSettings(options);

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
            var val = GetValue(data, match);

            // Replace
            if (typeof(val) === 'undefined')
                return '{{' + match + '}}';
            else {
                if (typeof (val) === 'function')
                    val = val();
                if (options.escape)
                    return EscapeForHtml(val);
                else
                    return val;
            }
        });
    
        return template;
    
    };

    function FillDOM(dom, data, options = defaultOptions) {
        options = GetAllOptionSettings(options);

        var stached = dom.querySelectorAll("[SS]");
        let translate = options.translate;

        stached.forEach((e) => {
            var assignments = e.getAttribute("SS").split(';');

            assignments.forEach((assignment) => {
                var target = assignment.split(':');
                var attribute = null;
                var ss;
                if (target.length > 1) {
                    attribute = target[0];
                    ss = target[1]
                }
                else {
                    ss = assignment;
                }
                var propDetail = GetPropertyDetail(data, ss);
                if (propDetail != null) {
                    var value = propDetail.parent[propDetail.propertyName]; // GetValue(data, ss);
                    if (typeof value !== 'undefined') {
                        if (attribute == null && translate && translate.hasOwnProperty(ss))
                            attribute = translate[ss];

                        FillElementWithData(e, attribute, value, propDetail, options);
                    }
                }
            });
            if (options.removess)
                e.removeAttribute("SS");
        });

        return dom;
    }

    function FillElementWithData(element, attribute, data, propDetail, options) {
        data = GetDataValue(data, propDetail.parent, element);

        if (isPlainObject(data)) {
            FillElementWithObject(element, data, options);
        }
        else {
            if (attribute) {
                if (element.hasAttribute(attribute))
                    AssignAttribute(element, attribute, data, propDetail, options);
                else
                    AssignProperty(element, attribute, data, propDetail, options);
            }
            else
                AssignText(element, data, propDetail, options);
        }
    }

    function FillElementWithObject(element, data, options) {
        let translate = options.translate;

        for (var key in data) {
            let tkey = key;
            let translated = false;
            var propDetail = GetPropertyDetail(data, key);
            let dataValue = GetDataValue(data[key], data, element);

            if (translate && translate.hasOwnProperty(key)) {
                tkey = translate[key];
                translated = true;
            }

            if (typeof element[tkey] !== 'undefined') {
                AssignProperty(element, tkey, dataValue, propDetail, options);
            }
            else if (element.hasAttribute(tkey)) {
                AssignAttribute(element, tkey, dataValue, propDetail, options);
            }
            else if (translated && options.alwaysSetTranslatedProperty)
                AssignProperty(element, tkey, dataValue, propDetail, options);
            }
    }

    function GetDataValue(data, src, element) {
        return (isFunction(data)) ? data(element, src) : data;
    }

    function SetDefaultOptions(options) {
        defaultOptions = GetAllOptionSettings(options);
    }

    function AssignAttribute(element, attribute, data, propDetail, options) {
        element.setAttribute(attribute, data);
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { element.setAttribute(attribute, GetDataValue(v, propDetail.parent, element)); });
        }
    }

    function AssignProperty(element, property, data, propDetail, options) {
        element[property] = data;
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { element[property] =  GetDataValue(v, propDetail.parent, element); });
        }
    }

    function AssignText(element, data, propDetail, options) {
        element.textContent = data;
        if (options.reactive) {
            ChangeSetter(propDetail, (v) => { element.textContent =  GetDataValue(v, propDetail.parent, element); });
        }
    }

    function ChangeSetter(propDetail, setter) {
        let set = propDetail.descriptor.set;
        let get = propDetail.descriptor.get;
        let currentValue = propDetail.parent[propDetail.propertyName];
        let descriptor = {
            get: () => (isFunction(get)) ? get() : currentValue,
            set: (v) => {
                (isFunction(set)) ? set(v) : currentValue = v; 
                setter(v); 
            },
            configurable: propDetail.descriptor.configurable,
            enumerable: propDetail.descriptor.enumerable
        };
        Object.defineProperty(propDetail.parent, propDetail.propertyName, descriptor);
}

    exports.fill = Fill;
    exports.fillHTML = FillHTML;
    exports.fillDOM = FillDOM;
    exports.options = SetDefaultOptions;
 
    return exports;
}();
