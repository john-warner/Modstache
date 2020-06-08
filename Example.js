var SimpleExample = function() {

    var list;
    var headTemplate;
    var templateHtml;
    var template2Html;
    var data = [
        {name:'Rand', value:'rand'},
        {name:'John', value:'john'}
    ];
    var objData = [
        { user: {name:'Ron', value:'ron'} },
        { user: {name:'Jack', value:'jack'} }
    ];
    var addresses = [
        { userid: { id: 'U1' }, name: 'John', 
          address: '1234 Maple', city: 'Phoenix', state: 'AZ', zipcode: '85000',
          contact: { name: 'Ken', phone: '555-5555' }},
        { userid: { id: 'U2' }, name: 'Rand', 
          address: '1st Street Main', city: 'New York City', state: 'NY', 
          zipcode: { style: 'color:red;', text: () => '01010', storage: 'hello'},
          contact: { name: { text: 'Jill', style:'color:cyan;'}, phone: '555-0000' }
        }
    ];
    var books = [
        { bookid: "B1", title: 'SSimple Programming', rating: '5/5', color: 'color:red', description: 'Great programming book.' },
        { bookid: "B2", title: 'Fun Times', rating: '4/5', color: 'color:blue', description: 'How to have fun.' }
    ]

    var message = { counter: 0, 
            message: 'Hello', 
            change: (i) => () => { i.data.counter++; Object.assign(i.data, { message: 'You pressed the button ' + i.data.counter + ' times.' }); /* data.message = 'Goodbye'; */ }};

    var time = { time: () => { return 'The current time is ' + (new Date()).toLocaleTimeString(); },
                 change: (i) => () => i.data.time = i.data.time };

    var testMessages = {
        messages: [
        { message: 'Test 1' },
        { message: 'Test 2' }
    ]};

    var formModel = {
        message: 'Enter message'
    };

    var GetDeleteOptionHandler = (data,array) => () => { let i=array.indexOf(data); array.splice(i,1); };
    var GetPositionOptionHandler = (data,array) => () => { let i=array.indexOf(data); array[i] = GetOption(i+1); };
    var GetOption = (i) => { return { value: i, 
                                      text: 'Option ' + i, 
                                      deleteOption: (i) => GetDeleteOptionHandler(i.data,i.array),
                                      positionOption: (i) => GetPositionOptionHandler(i.data,i.array) 
                                    }};
    var selectOptions = {
        addOption: (info) => () => {var i=info.data.options.length+1; info.data.options.push(GetOption(i))},
        prependOption: (info) => () => {var i=info.data.options.length+1; info.data.options.unshift(GetOption(i))},
        clearOptions: (info) => () => info.data.options.length = 0,
        options: [
        { value: 1, 
          text: 'Option 1', 
          deleteOption: (info) => GetDeleteOptionHandler(info.data,info.array),
          positionOption: (info) => GetPositionOptionHandler(info.data,info.array)
        },
        { value: 2, 
          text: 'Option 2', 
          deleteOption: (info) => GetDeleteOptionHandler(info.data,info.array),
          positionOption: (info) => GetPositionOptionHandler(info.data,info.array)
        }
    ]};

    $$.ready(Init);
    function Init() {
        console.log('Hello');

        list = $$.bind('#mylist');
        headTemplate = $$.bind('#listHeaderTemplate');
        templateHtml = $$.html($$.find('#listItemTemplate'));
        template2Html = $$.html($$.find('#listItem2Template'));
        PopulateHead();
        PopulateList();
        PopulateList2();
        ShowAddresses();
        ShowBooks();
        ShowMessage();
        ShowTime();
        TestArray();
        ShowSelect();
        SetupForm();
     }

    function PopulateHead() {
        list.$$.append(headTemplate.$$.copy());
    }

    function PopulateList() {
        data.forEach((d) => list.$$.append($$tache.fill(templateHtml, d)));
    }

    function PopulateList2() {
        objData.forEach((d) => list.$$.append($$tache.fill(template2Html, d)));
    }

    function ShowAddresses() {
        var template = $$.bind("#addressTemplate");
        var container = $$.bind("#addresses");
        var translate = { text: 'textContent', storage: 'data-storage', id: 'id' }
        //addresses.forEach((a) => { container.$$.append($$tache.fill(template.$$.copy(), a, { translate: translate }))});
        container.$$.append($$tache.fill(template.$$.copy(), {addresses:addresses}, { translate: translate, reactive: false, removeStache: true }));
    }

    function ShowBooks() {
        var template = $$.bind("#bookTemplate");
        var container = $$.bind("#books");
        var translate = { bookid: 'id' };
        books.forEach((b) => { container.$$.append($$tache.fill(template.$$.copy(), b, { translate: translate})); });
    }

    function ShowMessage() {
        var template = $$.bind("#messageTemplate");
        var container = $$.bind("#message");
        container.$$.append($$tache.fill(template.$$.copy(), message, { removeStache: true }));
    }

    function ShowTime() {
        var template = $$.bind("#timeTemplate");
        var container = $$.bind("#time");
        container.$$.append($$tache.fill(template.$$.copy(), time, { removeStache: true }));
        setInterval(() => { time.time = time.time; }, 1000);
    }

    function TestArray() {
        let descriptor = {
            get: function(target, property) {
                console.log('getting ' + property);
                const val = target[property];
                if (typeof val === 'function') {
                    if (['push', 'unshift', 'splice', 'filter'].includes(property)) {
                        return function (el) {
                            console.log('this is a array modification');
                            return Array.prototype[property].apply(target, arguments);
                        }
                    }
                    else if (['pop','shift'].includes(property)) {
                        return function () {
                            const el = Array.prototype[property].apply(target, arguments);
                            console.log('this is a array modification');
                            return el;
                        }
                    }
                    return val.bind(target);
                }
                return val;
            },
              set: function(target, property, value, receiver) {
                console.log('setting ' + property);
                if (!isNaN(property)) {
                    console.log('Modifying index ' + property);
                }
                if (['length'].includes(property)) {
                    if (target[property] > value) {
                        console.log('this is a array modification');
                    }
                }
                target[property] = value;
                // you have to return true to accept the changes
                return true;
              }
        };
        testMessages.messages = new Proxy(testMessages.messages, descriptor);

        testMessages.messages.push({ message: 'Test 3' });
        testMessages.messages[0] = { message: 'Test A' };
        testMessages.messages.splice(1,1);
        testMessages.messages.length = 1;
    }

    function ShowSelect() {
        var template = $$.bind("#optionsTemplate");
        var container = $$.bind("#options");
        container.$$.append($$tache.fill(template.$$.copy(), selectOptions, { removeStache: true }));
    }

    function SetupForm() {
        let form = $$.bind('#form');
        $$tache.fill(form, formModel, { removeStache: true });
    }

    return {
        addresses: addresses,
        books: books,
        message: message,
        time: time
    };

}();