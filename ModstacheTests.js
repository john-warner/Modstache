test('Test assertions are working', function (assert) {
    var result = [];
    var expected = [];
    assert.deepEqual(result, expected);
}); // use deepEqual for arrays see: https://api.qunitjs.com/deepEqual/

const fragmentHtml = (f) => [...f.childNodes].map(n => n.outerHTML).join('\n');

test('Test html without mustache values', function (assert) {
    var html = "<div></div>";
    var result = fragmentHtml(_M_.fill(html));
    var expected = html;
    assert.deepEqual(result, expected);
});

test('Test html with mustache values', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: 'Working!' };
    var result = fragmentHtml(_M_.fill(html, data));
    var expected = "<div>Working!</div>";
    assert.deepEqual(result, expected);
});

test('Test with missing data values', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { };
    var result = fragmentHtml(_M_.fill(html, data));
    var expected = html;
    assert.deepEqual(result, expected);
});

test('Test with enabled inserted script', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: '<script>log.console("scripted");</script>' };
    var result = fragmentHtml(_M_.fill(html, data, { escape: false }));
    var expected = "<div><script>log.console(\"scripted\");</script></div>";
    assert.deepEqual(result, expected);
});

test('Test with disabled inserted script', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: '<script>log.console("scripted");</script>' };
    var result = fragmentHtml(_M_.fill(html, data, { escape: true }));
    var expected = "<div>&lt;script&gt;log.console(\"scripted\");&lt;/script&gt;</div>";
    assert.deepEqual(result, expected);
});

test('Test with dom fragment', function (assert) {
    var html = '<div {}="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = "<div>Hello</div>";
    assert.deepEqual(result, expected);
});

test('Test dom fragment translation', function (assert) {
    var html = '<div {}="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: { text: 'Hello' } };
    var translate = { text: 'textContent' };

    template.innerHTML = html;
    _M_.fill(template.content, data, { translate: translate, removeStache: true });

    var result = template.innerHTML;
    var expected = "<div>Hello</div>";
    assert.deepEqual(result, expected);
});

test('Test dom fragment attribute setting', function (assert) {
    var html = '<div {}="value" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: { class: 'bold', textContent: 'Hello' } };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div class="bold">Hello</div>';
    assert.deepEqual(result, expected);
});

test('Test dom fragment external initialization', function (assert) {
    var html = '<div {}=":init"></div>';
    var template = document.createElement("template");
    var inited = false;
    var data = { init: () => { inited = true; } };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = inited;
    var expected = true;
    assert.deepEqual(result, expected);
});

test('Test dom fragment multiple attributes', function (assert) {
    var html = '<div {}="value;class:class" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello', class: 'bold' };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div class="bold">Hello</div>'
    assert.deepEqual(result, expected);
});

test('Test setting event handler', function (assert) {
    let html = '<div {}="onclick:click">Hello</div>';
    let template = document.createElement("template");
    let onclick = () => { alert('clicked'); }
    let data = { click: () => onclick };

    template.innerHTML = html;
    _M_.fill(template.content, data);
  
    var result = template.content.children[0].onclick;
    var expected = onclick;
    assert.deepEqual(result, expected);
});

test('Test reactive', function (assert) {
    var html = '<div {}="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.value = 'Bye';

    var result = template.innerHTML;
    var expected = "<div>Bye</div>";
    assert.deepEqual(result, expected);
});

// test('Test input change', function (assert) {
//     // var html = '<input type="text" {}="onchange:value>message" />';
//     // var template = document.createElement("template");
//     var data = { message: '' };

//     // template.innerHTML = html;
//     var input = document.querySelector('#inputTest');
//     var dom = _M_.fill(input, data, { removeStache: true });
//     //var input = dom.querySelector('input');
    
//     input.focus();
//     input.value = 'Hello';
//     input.blur();

//     var result = data.message;
//     var expected = "Hello";
//     assert.deepEqual(result, expected);
// });

test('Test SStache override default attribute', function (assert) {
    var html = '<div SS="value;class:class;" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello', class: 'bold' };

    template.innerHTML = html;
    _M_.fill(template.content, data, { stache: 'SS' });

    var result = template.innerHTML;
    var expected = '<div ss="value;class:class;" class="bold">Hello</div>'
    assert.deepEqual(result, expected);
});

test('Test with array', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div><div>One</div><div>Two</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with child array', function (assert) {
    var html = '<div {}="parent"><div {}="child;text"></div></div>';
    var data = { parent: [ { name: 'Parent', child: [{ text: (ctx) => ctx.parentage[1].name + ':One'}, { text: 'Two' }] }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div><div>Parent:One</div><div>Two</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array push', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text.push({ text: 'Three' });
    var result = template.innerHTML;
    var expected = '<div><div>One</div><div>Two</div><div>Three</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array unshift', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text.unshift({ text: 'Three' });
    var result = template.innerHTML;
    var expected = '<div><div>Three</div><div>One</div><div>Two</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array splice', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text.splice(1,1,{ text: 'Three' },{ text: 'Four' });
    var result = template.innerHTML;
    var expected = '<div><div>One</div><div>Three</div><div>Four</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array pop', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text.pop();
    var result = template.innerHTML;
    var expected = '<div><div>One</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array shift', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text.shift();
    var result = template.innerHTML;
    var expected = '<div><div>Two</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array index assignment', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text[1] = { text: "abc" };
    var result = template.innerHTML;
    var expected = '<div><div>One</div><div>abc</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array length assignment', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });
    data.text.length = 1;
    var result = template.innerHTML;
    var expected = '<div><div>One</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array modified template', function (assert) {
    var html = '<div><div {}="templatetest;{template}:mytemplate"></div></div>';
    var html1 = '<div>Template One</div>';
    var html2 = '<div>Template Two</div>';
    var template = document.createElement("template");
    var template1 = document.createElement("template");
    var template2 = document.createElement("template");
    var data = { templatetest: [{ mytemplate: template1.content }, { mytemplate: template2.content }] };

    template.innerHTML = html;
    template1.innerHTML = html1;
    template2.innerHTML = html2;
    _M_.fill(template.content, data, { removeStache: true });
    var result = template.innerHTML;
    var expected = '<div><div>Template One</div><div>Template Two</div></div>'
    assert.deepEqual(result, expected);
});

test('Test {if} directive', function (assert) {
    var html = '<div><div {}="{if}:hide">Hidden</div><div {}="{if}:show">Shown</div></div>';
    var template = document.createElement("template");
    var data = { show: true, hide: false };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div><div>Shown</div></div>';
    assert.deepEqual(result, expected);
});

test('Test {root} directive', function (assert) {
    var html = '<div {}="{root}:test"><div {}="message">Wrong</div></div>';
    var template = document.createElement("template");
    var data = { test: { message: 'Right!' } };

    template.innerHTML = html;
    _M_.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div><div>Right!</div></div>';
    assert.deepEqual(result, expected);
});
