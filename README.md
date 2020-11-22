# modstache
The SStache utility library can create and/or assign DOM element properties or attributes through data objects. Replace HTML strings using mustache syntax {{}} or through "{}" attribute definition. The data object can also become reactive, where changing a property value will reflect immediately in the DOM.

This is not a full featured framework, such as Angular, React or Vue. There is no shadow/virtual DOM or element creation based on encoded values. Operations are made directly with HTML strings for the mustache "{{}}" replacement and DOM fragments/trees replacement with the "{}" attribute values. This allows for quick and automatic assignment of the data model to the UI components.

Data passed for assignment can be any needed value for the DOM element. The default property to replace is the textContent of the element. Other attributes/properties can be targetted by preceding the data property name with the element's property/attribute name, for example, "class:classValue". Direct assignment is made with the data property value with the following exceptions:

 If an assignment is made with a data property containing a function, then the function is evaluated to obtain the assigned value. This allows calculations or additional operations to be made during the assignment.
 
 If an assignment is made with a data property containing an object, then the new object's keys are used to assign to specify the attributes/properties and values of the DOM element.

 If an assignment is made with an array, then the DOM element and children are duplicated for each entry in the array. Each array entry is used as the model for the new elements.

To use the SStache library, include SStache.js or SStache.min.js file:

 ```javascript
   <script src="Modstache.min.js"></script>
```
This will create the Modstache object that exposes the following API :

* fill - assigns data properties. Works on an HTML string or DOM fragment. Returns the filled DOM fragment.
* fillHTML - assigns data properties to an HTML string by replacing mustache syntax {{}}
* fillDOM - assigns data properties to a DOM fragment by looking for elements with the {} attribute
* options - gets/sets the default options for Modstache.

The Modstache library can also be accessed through the _M_ variable.

### Modstache.fill

Assigns data properties. Works on an HTML string or DOM fragment. Returns the filled DOM fragment.

#### API call

 ```javascript
var targetFragment = Modstache.fill(target:HTML string or DOM fragment, data:object, optional options:object);
```

**Returns**
The passed DOM fragment is modified and returned or a new fragment is created from the passed HTML.

#### Example of Modstache.fill with HTML string

 ```javascript
    var html = "<div>{{value}}</div>";
    var data = { value: 'Testing!' };
    var fragment = Modstache.fill(html, data);
    // fragment contains DOM elements "<div>Testing!</div>"
```

#### Example of Modstache.fill with DOM fragment

 ```javascript
    var html = '<div {}="value">This is replaced</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    Modstache.fill(template.content, data, { removeStache: true });
    // template.innerHTML is "<div>Hello</div>"
```

### Modstache.fillHTML

Assigns data properties to an HTML string by replacing mustache syntax {{}}

#### API call

 ```javascript
var html = Modstache.fillHTML(target:HTML string, data:object, optional options:object);
```

**Returns**
An HTML string with replacements

#### Example

 ```javascript
    var html = "<div>{{value}}</div>";
    var data = { value: 'Testing!' };
    var filledHtml = Modstache.fillHTML(html, data);
    // filledHtml contains string "<div>Testing!</div>"
```

### Modstache.fillDOM

Assigns data properties to a DOM fragment by looking for elements with the {} attribute

#### API call

 ```javascript
var fragment = Modstache.fillDOM(target:DOM fragment, data:object, optional options:object);
```

**Returns**
The passed DOM fragment is modified and returned. The data object is modified based on reactive option.

#### Example

 ```javascript
    var html = '<div {}="value">This is replaced</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    Modstache.fillDOM(template.content, data, { removeStache: true });
    // template.innerHTML is "<div>Hello</div>"
```

### Stache attribute formatting

The stache attribute can be formatted as follows:

 ```html
    <div {}="text;property1:prop1Value;property2:prop2Value;">This is replaced by default</div>
```

The names for "text", "property1", etc can be changed to match the data object properties. The element property to be assigned
can be a property of a child object, for example "style.color:colorValue".

The data object would be setup as follows:

 ```javascript
     var data = { text: 'My text', property1: prop1Value, property2: prop2Value };
```


#### Example for populating an address component

HTML
 ```html
    <div>
        <b>Name:</b> <span {}="name"></span><br />
        <b>Address:</b> <span {}="address"></span><br />
        <b>City:</b> <span {}="city"></span>, <span {}="state"></span> <b>Zipcode:</b> <span {}="zipcode" data-storage=""></span><br />
    </div>
```

Javascript
 ```javascript
    var address = { name: 'John Doe', address: '1234 Maple', city: 'Anytown', state: 'US', zipcode: '80000' };
```


#### Example changing address name style

HTML
 ```html
    <div>
        <b>Name:</b> <span {}="name"></span><br />
        <b>Address:</b> <span {}="address"></span><br />
        <b>City:</b> <span {}="city"></span>, <span {}="state"></span> <b>Zipcode:</b> <span {}="zipcode" data-storage=""></span><br />
    </div>
```

Javascript
 ```javascript
    var address = { name: { text: 'Jill', style:'color:cyan;'}, address: '1234 Maple', city: 'Anytown', state: 'US', zipcode: '80000' };
```

#### Calculating a data value

Data values can be provided by a function instead of a direct value. For example, the following shows how to modify a button's text
depending on other values in the provided data


HTML
 ```html
    <button {}="btn.label;onclick:btn.onclick">Create</button>
```

Javascript
 ```javascript
    var state = {
         model: { id: 1 },
         btn: {
             label: (ctx, element, parent) => { return (ctx.root.model.id !== 0) ? 'Update' : ctx.element.innerHTML},
             onclick: (ctx, element, parent) => () => alert('Button has been clicked')
          }
    };
```

Functions in the data are passed an object parameter with the context. It has the following properties:

* element - the DOM element being processed
* root - the data object passed into SStache or the object in an array used to fill the template
* parent - the parent object containing the data function
* key - the key in data containing the data function
* array - the containing array, if used
* base - the original object passed into SStache

In the example above, ctx would contain the following values for the btn.label specifier:

Javascript
 ```javascript
    ctx = {
         element: button_DOM_Element,
         root: state,
         parent: state.btn,
         key: 'label',
         array: null,
         base: state
    };
```

Additional parameters for the element and parent values are passed to the function to simplify access.

#### Modify using reactive data

The default fill configuration is to make the data reactive.  This means that after the initial fill, the UI will be updated automatically on changes to the data. For example, with the following HTML and Javascript:

HTML
 ```html
    <div id="myMessage" {}="message"></div>
```

Javascript
 ```javascript
    var message = { message: 'Hello' };
    Modstache.fill(document.getElementById('myMessage'), message);
```

This will result in the following HTML:
 ```html
    <div id="myMessage" {}="message">Hello</div>
```

After the message is changed:
 ```javascript
    message.message = 'Hi';
```

The HTML will change to:
 ```html
    <div id="myMessage" {}="message">Hi</div>
```

The values in the data can be modified in the following ways to preserve the reactive nature of the data:
 ```javascript
    message.message = newvalue;
    Object.assign(message, { message: newvalue });
```

The following methods can be used to clear the reactive nature of the data:
 ```javascript
    message = Object.assign({}, message);
    message = {...message};
```
The UI can be filled again with the new object to make it reactive.

#### Modify model when form changes

The reactive feature for SStache is one way, meaning that UI elements are modified when the data is changed. It is possible to modify
the model data when a UI form element is modified by tying an event, such as onchange, to a function that modified the model member.
This can be handled with the SStache specifier by assigning the event to a property/data pairing using '>' as a separator.

This HTML will modify the message property of the data when the input text is changed:
 ```html
    <input {}="onchange:value>message" />
```

You can also assign the property or attribute to a function in the model. The function will be passed the property value and the SStache context.


### Modstache.options

The following options can be defined through Modstache.options

#### API call

 ```javascript
var options = Modstache.options({ modified properties });
```

**Returns**
The passed DOM fragment is modified and returned or a new fragment is created from the passed HTML.

* removeStache (false) - remove the stache attribute in the processed fragment
* escape (true) - process replacement values for valid HTML text while disabling scripts
* translate: (null) - object with property mappings
* alwaysSetTranslatedProperty (false) - make sure property is defined if specified in translation object
* reactive (true) - modify data object to affect target fragment when changed
* stache ('{}') - name of the attribute to use for stache replacement specification


### Directives

Directives are properties in the stache attribute that require special handling. Directives are in the format
"{directive}". The following directives are supported:

* {if} - the element is rendered or removed based on the model value associated with the "if" directive
* {root} - process element children using a specified root data object.
* {oninit} - the associated function is called after the element has been processed
* {template} - specifies a template to use for an array element
* {base} - Used to refer to the original object used to fill. Eg. {}="textContent:{base}.message"


