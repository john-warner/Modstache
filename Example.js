var ModstacheExample = function() {

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
        { userid: { id: 'U1' }, name: 'John',  nameColor: 'blue', init: (ctx) => console.log('init address ' + ctx.parent.name),
          address: '1234 Maple', city: 'Phoenix', state: 'AZ', zipcode: '85000',
          contact: { name: 'Ken', phone: '555-5555' }},
        { userid: { id: 'U2' }, name: 'Rand',   nameColor: 'red', init: (ctx) => console.log('init address ' + ctx.parent.name),
          address: '1st Street Main', city: 'New York City', state: 'NY', 
          zipcode: { style: 'color:orangered;', text: () => '01010', storage: 'hello'},
          contact: { name: { text: 'Jill', style:'color:cyan;'}, phone: '555-0000' }
        }
    ];
    var books = [
        { bookid: "B1", title: 'SSimple Programming', rating: '5/5', color: 'color:red', description: 'Great programming book.' },
        { bookid: "B2", title: 'Fun Times', rating: '4/5', color: 'color:blue', description: 'How to have fun.' }
    ]

    var message = { counter: 0, 
            message: 'Hello', 
            change: (ctx) => () => { ctx.parent.counter++; Object.assign(ctx.parent, { message: 'You pressed the button ' + ctx.parent.counter + ' times.' }); }};

    var time = { time: (ctx) => {
                    setInterval(() => { ctx.parent.time = ctx.parent.time; }, 1000); // set up automatic update for reactive assignment
                    ctx.parent.time = () => { return 'The current time is ' + (new Date()).toLocaleTimeString(); };
                    return ctx.parent.time();
                    },
                 change: (ctx) => {
                    return () => ctx.parent.time = ctx.parent.time 
                } };

    var testMessages = {
        messages: [
        { message: 'Test 1' },
        { message: 'Test 2' }
    ]};

    var formModel = {
        message: 'Enter message'
    };

    var form2Model = {
        message: 'Enter message',
        procMessage: (m,c) => c.parent.message = m
    };

    var roottestModel = {
        message: 'Base message',
        roottest: {
            message: 'Modified message'
        }
    };

    var GetDeleteOptionHandler = (data,array) => () => { let i=array.indexOf(data); array.splice(i,1); };
    var GetPositionOptionHandler = (data,array) => () => { let i=array.indexOf(data); array[i] = GetOption(i+1); };
    var GetOption = (i) => { return { value: i, text: 'Option ' + i }};
    var selectOptions = {
        addOption: (ctx) => () => {var i=ctx.parent.options.length+1; ctx.parent.options.push(GetOption(i))},
        prependOption: (ctx) => () => {var i=ctx.parent.options.length+1; ctx.parent.options.unshift(GetOption(i))},
        clearOptions: (ctx) => () => ctx.parent.options.length = 0,
        deleteOption: (ctx) => GetDeleteOptionHandler(ctx.root,ctx.array),
        positionOption: (ctx) => GetPositionOptionHandler(ctx.root,ctx.array),
        options: [
        { value: 1, text: 'Option 1' },
        { value: 2, text: 'Option 2' }
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
        SetupForm2();
        RootChangeTest();
     }

    function PopulateHead() {
        list.$$.append(headTemplate.$$.copy());
    }

    function PopulateList() {
        data.forEach((d) => list.$$.append(_M_.fill(templateHtml, d)));
    }

    function PopulateList2() {
        objData.forEach((d) => list.$$.append(_M_.fill(template2Html, d)));
    }

    function ShowAddresses() {
        var template = $$.bind("#addressTemplate");
        var container = $$.bind("#addresses");
        var translate = { text: 'textContent', storage: 'data-storage', id: 'id' }
        //addresses.forEach((a) => { container.$$.append(_M_.fill(template.$$.copy(), a, { translate: translate }))});
        container.$$.append(_M_.fill(template.$$.copy(), {addresses:addresses}, { translate: translate, reactive: true, removeStache: true }));
        addresses[1].zipcode.style += 'background-color:lightblue;'; // test reactive
        addresses[0].nameColor = 'orange';
    }

    function ShowBooks() {
        var template = $$.bind("#bookTemplate");
        var container = $$.bind("#books");
        var translate = { bookid: 'id' };
        books.forEach((b) => { container.$$.append(_M_.fill(template.$$.copy(), b, { translate: translate})); });
    }

    function ShowMessage() {
        var template = $$.bind("#messageTemplate");
        var container = $$.bind("#message");
        container.$$.append(_M_.fill(template.$$.copy(), message, { removeStache: true }));
    }

    function ShowTime() {
        var template = $$.bind("#timeTemplate");
        var container = $$.bind("#time");
        container.$$.append(_M_.fill(template.$$.copy(), time, { removeStache: true }));
        //setInterval(() => { time.time = time.time; }, 1000);
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
        container.$$.append(_M_.fill(template.$$.copy(), selectOptions, { removeStache: true }));
    }

    function SetupForm() {
        let form = $$.bind('#form');
        _M_.fill(form, formModel, { removeStache: true });
    }

    function SetupForm2() {
        let form = $$.bind('#form2');
        _M_.fill(form, form2Model, { removeStache: true });
    }

    function RootChangeTest() {
        let roottest = $$.bind('#roottest');
        _M_.fill(roottest, roottestModel, { removeStache: true });
    }

    return {
        addresses: addresses,
        books: books,
        message: message,
        time: time
    };

}();