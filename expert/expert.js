"use strict";

let facts = {};
let results = {};
let theme = '';

const itemTemplate = document.getElementById('item-template');
const rulesTemplate = document.getElementById('rules-template');
const rulesFactTemplate = document.getElementById('rules-fact-template');
const factSection = document.getElementById('fact-section');
const rulesSection = document.getElementById('rules-section');

function transition(callback) {
  if (!document.startViewTransition) {
    return callback;
  }

  return () => document.startViewTransition(callback);
}

let factsCount = 0;

const factField = document.getElementById('fact-field');
const factList = document.getElementById('fact-list');

const themeField = document.getElementById('theme-field');
themeField.oninput = (event) => theme = event.target.value;

function addFact(value, id) {
  id ||= `F${factsCount}`;
  ++factsCount;
  facts[id] = {name: value};

  const item = itemTemplate.content.cloneNode(true);
  const li = item.querySelector('li');
  item.querySelector('.text').textContent = value;
  item.querySelector('.delete').onclick = () => {
    li.remove();
    delete facts[id];
  };
  transition(() => factList.appendChild(item))();
  factField.value = '';
}

document.getElementById('add-fact').onclick = () => {
  const {value} = factField;
  if (value) {
    addFact(value);
  }
};

document.getElementById('to-rules-section').onclick =
  transition(() => {
    factSection.setAttribute('hidden', '');
    rulesSection.removeAttribute('hidden');
  });


let resultsCount = 0;

const resultField = document.getElementById('result-field');
const resultList = document.getElementById('result-list');


function addResult(value, id) {
  id ||= `R${resultsCount}`;
  ++resultsCount;
  results[id] = {name: value};
  const item = itemTemplate.content.cloneNode(true);
  const li = item.querySelector('li');
  item.querySelector('.text').textContent = value;
  item.querySelector('.delete').onclick = () => {
    li.remove();
    delete results[id];
  };
  transition(() => resultList.appendChild(item))();
  resultField.value = '';
}

document.getElementById('add-result').onclick = () => {
  const {value} = resultField;
  if (value) {
    addResult(value);
  }
};


const downloadBtn = document.getElementById('download');

document.getElementById('to-facts-section').onclick =
  transition(() => {
    rulesSection.setAttribute('hidden', '');
    factSection.removeAttribute('hidden');
  });

const ruleList = document.getElementById('rule-list');

document.getElementById('reset').onclick =
  transition(() => ruleList.innerHTML = '');

function addRule(id, rule) {
  const item = rulesTemplate.content.cloneNode(true);

  const fieldset = item.querySelector('fieldset');
  const selectResult = item.querySelector('select');

  for (const [value, item] of Object.entries(results)) {
    const option = document.createElement('option');
    option.setAttribute('value', value);
    option.setAttribute('label', item.name);
    selectResult.appendChild(option);
  }

  const factRuleList = item.querySelector('.fact-rule-list');

  item.querySelector('.delete-rule-btn').onclick =
    transition(() => fieldset.remove());

  function addFactToRule(fact, isNegative) {
    const item = rulesFactTemplate.content.cloneNode(true);

    const select = item.querySelector('select');

    const factsGroup = document.createElement('optgroup')
    factsGroup.setAttribute('label', 'Исходные факты');
    for (const [value, item] of Object.entries(facts)) {
      const option = document.createElement('option');
      option.setAttribute('value', value);
      option.setAttribute('label', item.name);
      factsGroup.appendChild(option);
    }
    select.appendChild(factsGroup);

    const resultsGroup = document.createElement('optgroup')
    resultsGroup.setAttribute('label', 'Промежуточные результаты');
    for (const [value, item] of Object.entries(results)) {
      const option = document.createElement('option');
      option.setAttribute('value', value);
      option.setAttribute('label', item.name);
      resultsGroup.appendChild(option);
    }
    select.appendChild(resultsGroup);

    if (fact) {
      select.value = fact;
      item.querySelector('input').value = isNegative;
    }

    factRuleList.appendChild(item);
  }

  item.querySelector('.add-fact-btn').onclick = () => {
    addFactToRule();
  };

  if (rule) {
    selectResult.value = id;
    item.querySelector('input').value = rule.coef;

    for (const fact of rule.positive) {
      addFactToRule(fact, false);
    }
    for (const fact of rule.negative) {
      addFactToRule(fact, true);
    }
  }

  ruleList.appendChild(item);
}

document.getElementById('add-rule').onclick = () => addRule();


document.getElementById('save').onclick = () => {
  const ex = {
    theme,
    facts,
    results: {...results},
  };

  ruleList.querySelectorAll('.rules-set').forEach(set => {
    const r = set.querySelector('select').value;

    const item = ex.results[r];
    const coef = +set.querySelector('input').value;
    const positive = [], negative = [];

    set.querySelectorAll('.fact-set').forEach(fact => {
      if (fact.querySelector('input').checked) {
        negative.push(fact.querySelector('select').value);
      } else {
        positive.push(fact.querySelector('select').value);
      }
    });

    item.rules ??= [];
    item.rules.push({coef, positive, negative});
  });

  downloadBtn.href = URL.createObjectURL(
    new Blob(
      [JSON.stringify(ex, null, ' ')],
      {type: 'application/json'}
    )
  );
  downloadBtn.download = `${theme}.json`;
  downloadBtn.click();
};


function resetAll() {
  facts = {};
  results = {};
  theme = '';
  themeField.value = '';
  ruleList.innerHTML = '';
  factList.innerHTML = '';
  resultList.innerHTML = '';
}

function onLoad(data) {
  resetAll();

  themeField.value = theme = data.theme || '';
  for (const [id, item] of Object.entries(data.facts)) {
    addFact(item.name, id);
  }
  for (const [id, item] of Object.entries(data.results)) {
    addResult(item.name, id);
  }
  for (const [id, item] of Object.entries(data.results)) {
    for (const rule of item.rules) {
      addRule(id, rule);
    }
  }
}

document.getElementById('resetAll').onclick = transition(resetAll);


document.getElementById('file').onchange = (event) => {
  const reader = new FileReader();
  reader.onload = (e) =>
    transition(() => onLoad(JSON.parse(e.target.result)))();

  reader.readAsText(event.target.files[0]);
};
