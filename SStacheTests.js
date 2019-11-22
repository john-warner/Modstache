test('Test assertions are working', function (assert) {
    var result = [];
    var expected = [];
    assert.deepEqual(result, expected);
}); // use deepEqual for arrays see: https://api.qunitjs.com/deepEqual/

const fragmentHtml = (f) => [...f.childNodes].map(n => n.outerHTML).join('\n');

test('Test html without mustache values', function (assert) {
    var html = "<div></div>";
    var result = fragmentHtml($$tache.fill(html));
    var expected = html;
    assert.deepEqual(result, expected);
});

test('Test html with mustache values', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: 'Working!' };
    var result = fragmentHtml($$tache.fill(html, data));
    var expected = "<div>Working!</div>";
    assert.deepEqual(result, expected);
});

test('Test with missing data values', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { };
    var result = fragmentHtml($$tache.fill(html, data));
    var expected = html;
    assert.deepEqual(result, expected);
});

test('Test with enabled inserted script', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: '<script>log.console("scripted");</script>' };
    var result = fragmentHtml($$tache.fill(html, data, { escape: false }));
    var expected = "<div><script>log.console(\"scripted\");</script></div>";
    assert.deepEqual(result, expected);
});

test('Test with disabled inserted script', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: '<script>log.console("scripted");</script>' };
    var result = fragmentHtml($$tache.fill(html, data, { escape: true }));
    var expected = "<div>&lt;script&gt;log.console(\"scripted\");&lt;/script&gt;</div>";
    assert.deepEqual(result, expected);
});

test('Test with dom fragment', function (assert) {
    var html = '<div {}="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });

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
    $$tache.fill(template.content, data, { translate: translate, removeStache: true });

    var result = template.innerHTML;
    var expected = "<div>Hello</div>";
    assert.deepEqual(result, expected);
});

test('Test dom fragment attribute setting', function (assert) {
    var html = '<div {}="value" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: { class: 'bold', textContent: 'Hello' } };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div class="bold">Hello</div>'
    assert.deepEqual(result, expected);
});

test('Test dom fragment multiple attributes', function (assert) {
    var html = '<div {}="value;class:class" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello', class: 'bold' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });

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
    $$tache.fill(template.content, data);
  
    var result = template.content.children[0].onclick;
    var expected = onclick;
    assert.deepEqual(result, expected);
});

test('Test reactive', function (assert) {
    var html = '<div {}="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });
    data.value = 'Bye';

    var result = template.innerHTML;
    var expected = "<div>Bye</div>";
    assert.deepEqual(result, expected);
});


test('Test SStache override default attribute', function (assert) {
    var html = '<div SS="value;class:class;" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello', class: 'bold' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { stache: 'SS' });

    var result = template.innerHTML;
    var expected = '<div ss="value;class:class;" class="bold">Hello</div>'
    assert.deepEqual(result, expected);
});

test('Test with array', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });

    var result = template.innerHTML;
    var expected = '<div><div>One</div><div>Two</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array push', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });
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
    $$tache.fill(template.content, data, { removeStache: true });
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
    $$tache.fill(template.content, data, { removeStache: true });
    data.text.splice(1,1,{ text: 'Three' });
    var result = template.innerHTML;
    var expected = '<div><div>One</div><div>Three</div></div>'
    assert.deepEqual(result, expected);
});

test('Test with array pop', function (assert) {
    var html = '<div><div {}="text"></div></div>';
    var data = { text: [{ text: 'One'}, { text: 'Two' }] };
    var template = document.createElement("template");

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removeStache: true });
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
    $$tache.fill(template.content, data, { removeStache: true });
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
    $$tache.fill(template.content, data, { removeStache: true });
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
    $$tache.fill(template.content, data, { removeStache: true });
    data.text.length = 1;
    var result = template.innerHTML;
    var expected = '<div><div>One</div></div>'
    assert.deepEqual(result, expected);
});
