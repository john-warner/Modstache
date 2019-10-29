// SStache
// Simple mustache placeholder replacement
// Slightly modified from placeholder.js
// Thank you Chris Ferdinandi at https://vanillajstoolkit.com/helpers/placeholders/
//
var $$tache = function() {

    var version = '0.5.2';
  
    var exports = { version: version };
    var defaultOptions = {
        removess: false,
        escape: true,
        translate: null,
        alwaysSetTranslatedProperty: false
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

    function Fill(template, data, options = defaultOptions) {
        if (typeof template === "string")
            template = fragment(FillHTML(template, data, options));

        return FillDOM(template, data, options);
    }

    function FillHTML(template, data, options = defaultOptions) {
        options = GetAllOptionSettings(options);

         // Check if the template is a string or a function
        template = typeof (template) === 'function' ? template() : template;
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
                var value = GetValue(data, ss);
                if (typeof value !== 'undefined') {
                    if (attribute == null && translate && translate.hasOwnProperty(ss))
                        attribute = translate[ss];

                    FillElementWithData(e, attribute, value, data, options);
                }
            });
            if (options.removess)
                e.removeAttribute("SS");
        });

        return dom;
    }

    function FillElementWithData(element, attribute, data, src, options) {
        data = GetDataValue(data, src, element);

        if (Object.prototype.toString.call(data) === '[object Object]') {
            FillElementWithObject(element, data, options);
        }
        else {
            if (attribute) {
                if (element.hasAttribute(attribute))
                    element.setAttribute(attribute, data);
                else
                    element[attribute] = data;
            }
            else
                element.textContent = data;
        }
    }

    function FillElementWithObject(element, data, options) {
        let translate = options.translate;

        for (var key in data) {
            let tkey = key;
            let translated = false;
            let dataValue = GetDataValue(data[key], data, element);

            if (translate && translate.hasOwnProperty(key)) {
                tkey = translate[key];
                translated = true;
            }

            if (typeof element[tkey] !== 'undefined') {
                element[tkey] = dataValue;
            }
            else if (element.hasAttribute(tkey)) {
                element.setAttribute(tkey, dataValue);
            }
            else if (translated && options.alwaysSetTranslatedProperty)
                element[tkey] = dataValue;
        }
    }

    function GetDataValue(data, src, element) {
        return (typeof data === 'function') ? data(element, src) : data;
    }

    function SetDefaultOptions(options) {
        defaultOptions = GetAllOptionSettings(options);
    }

    exports.fill = Fill;
    exports.fillHTML = FillHTML;
    exports.fillDOM = FillDOM;
    exports.options = SetDefaultOptions;
 
    return exports;
}();
