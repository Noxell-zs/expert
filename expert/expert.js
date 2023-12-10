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

{
  let factsCount = 0;

  const factField = document.getElementById('fact-field');
  const factList = document.getElementById('fact-list');

  document.getElementById('themeField').oninput =
    (event) => theme = event.target.value;

  document.getElementById('addFact').onclick = () => {
    const {value} = factField;

    if (value) {
      const id = `f${factsCount}`;
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
  };

  document.getElementById('to-rules-section').onclick =
    transition(() => {
      factSection.setAttribute('hidden', '');
      rulesSection.removeAttribute('hidden');
    });


  let resultsCount = 0;

  const resultField = document.getElementById('result-field');
  const resultList = document.getElementById('result-list');

  document.getElementById('add-result').onclick = () => {
    const {value} = resultField;

    if (value) {
      const id = `r${resultsCount}`;
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
  };
}

{
  const downloadBtn = document.getElementById('download');

  document.getElementById('to-facts-section').onclick =
    transition(() => {
      rulesSection.setAttribute('hidden', '');
      factSection.removeAttribute('hidden');
    });

  const ruleList = document.getElementById('rule-list');

  document.getElementById('reset').onclick =
    transition(() => ruleList.innerHTML = '');


  document.getElementById('add-rule').onclick = () => {
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

    item.querySelector('.add-fact-btn').onclick = () => {
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


      factRuleList.appendChild(item);
    };

    ruleList.appendChild(item);
  };


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
}

