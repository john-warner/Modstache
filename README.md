# SStache
The SStache utility library can create and/or assign DOM element properties or attributes through data objects. Replace HTML strings using mustache syntax {{}} or through "{}" attribute definition. The data object can also become reactive, where changing a property value will reflect immediately in the DOM.

This is not a full featured framework, such as Angular, React or Vue. There is no shadow/virtual DOM or element creation based on encoded values. Operations are made directly with HTML strings for the mustache "{{}}" replacement and DOM fragments/trees replacement with the "{}" attribute values. This allows for quick and automatic assignment of the data model to the UI components.

Data passed for assignment can be any needed value for the DOM element. The default property to replace is the textContent of the element. Other attributes/properties can be targetted by preceding the data property name with the element's property/attribute name, for example, "class:classValue". Direct assignment is made with the data property value with the following exceptions:

 If an assignment is made with a data property containing a function, then the function is evaluated to obtain the assigned value. This allows calculations or additional operations to be made during the assignment.
 
 If an assignment is made with a data property containing an object, then the new object's keys are used to assign to specify the attributes/properties and values of the DOM element.
