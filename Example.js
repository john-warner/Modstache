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
    var message = { message: 'Hello', change: (e,data) => () => { Object.assign(data, { message: 'Goodbye' }); /* data.message = 'Goodbye'; */ }};

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
        addresses.forEach((a) => { container.$$.append($$tache.fill(template.$$.copy(), a, { translate: translate }))});
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
        container.$$.append($$tache.fill(template.$$.copy(), message, { removess: true }));
    }

    return {
        addresses: addresses,
        books: books,
        message: message
    };

}();