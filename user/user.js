"use strict";

let base;
const questionTemplate = document.getElementById('questionTemplate');


/**
 * @param k1 {number}
 * @param k2 {number}
 * @return {number}
 */
function getCoef(k1, k2) {
  if (k1 >= 1 || k2 >= 1) return 1;
  if (k1 <= -1 || k2 <= -1) return -1;

  const mul = k1 * k2;

  if (mul <= 0) return k1 + k2;
  if (k1 > 0 && k2 > 0) return k1 + k2 - mul;
  if (k1 < 0 && k2 < 0) return k1 + k2 + mul;

  return 0;
}

/**
 * @return {string}
 */
function getRandomColor() {
  return `rgb(${Array.from(
    [0,0,0],
    () => Math.floor(Math.random()*256)
  )})`;
}

async function transition(callback) {
  if (!document.startViewTransition) {
    return callback();
  }

  return document.startViewTransition(callback).finished;
}


let chart;

function createChart() {
  const values = Object.values(base.results);

  const data = values.map(v => v.coef);
  const categories = Object.entries(base.results)
    .map(([id, value]) => `${id} - ${value.name}`);
  const colors = values.map(getRandomColor);
  const height = values.length * 100;

  const target = `Рекомендуемый выбор:  ${values.reduce(
    (prev, curr) => prev.coef > curr.coef ? prev : curr
  ).name}`;

  const options = {
    series: [{data}],
    chart: {
      type: 'bar',
      height
    },
    plotOptions: {
      bar: {
        barHeight: '100%',
        distributed: true,
        horizontal: true,
        dataLabels: {
          position: 'bottom'
        },
      }
    },
    colors,
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#fff']
      },
      formatter: (val, opt) =>
        `${opt.w.globals.labels[opt.dataPointIndex]}:  ${(+val).toPrecision(2)}`,
      offsetX: 0,
      dropShadow: {
        enabled: true
      }
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {categories},
    yaxis: {
      labels: {
        show: false
      }
    },
    title: {
      text: target,
      align: 'center',
      floating: true
    },
    subtitle: {
      text: base.theme || '',
      align: 'center',
    },
    tooltip: {
      y: {
        title: {
          formatter: () => ''
        }
      }
    }
  };

  chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
}

function updateChartData() {
  const values = Object.values(base.results);

  const data = values.map(v => v.coef);
  const categories = Object.entries(base.results)
    .map(([id, value]) => `${id} - ${value.name}`);
  const colors = values.map(getRandomColor);
  const height = values.length * 100;

  const target = `Рекомендуемый выбор:  ${values.reduce(
    (prev, curr) => prev.coef > curr.coef ? prev : curr
  ).name}`;

  chart.updateOptions({
    series: [{data}],
    chart: {height},
    colors,
    xaxis: {categories},
    title: {
      text: target,
      align: 'center',
      floating: true
    },
    subtitle: {
      text: base.theme || '',
      align: 'center',
    },
  });
}

function updateChartValues() {
  const values = Object.values(base.results);
  const data = values.map(v => v.coef);
  const target = `Рекомендуемый выбор:  ${values.reduce(
    (prev, curr) => prev.coef > curr.coef ? prev : curr
  ).name}`;

  chart.updateOptions({
    series: [{data}],
    title: {
      text: target,
      align: 'center',
      floating: true
    },
  });
}

function computeResult(rules) {
  if (!rules) return 0;

  return rules.map(rule => rule.coef * Math.min(
    ...rule.positive.map(key => coefFromKey(key)),
    ...rule.negative.map(key => -coefFromKey(key)),
  )).reduce(getCoef, 0);
}

function coefFromKey(key) {
  const {facts, results} = base;
  if (key in facts) {
    return facts[key].coef;
  }
  if (key in results) {
    return results[key].coef ??= computeResult(results[key].rules);
  }

  return 0;
}

function updateResults() {
  for (const key in base.results) {
    coefFromKey(key);
  }

  if (chart) {
    updateChartData();
  } else {
    createChart();
  }
  transition(drawAllRules);
}

function updateFactsCoef() {
  for (const result of Object.values(base.results)) {
    result.coef = null;
  }
  for (const key in base.results) {
    coefFromKey(key);
  }
  updateChartValues();
  transition(drawAllRules);
}

const mathEl = document.getElementById('math');

let selectedRules = new Set();
function selectRule(resultId, rule) {
  if (selectedRules.has(rule)) return;
  selectedRules.add(rule);

  const math = document.createElement('math');
  
  const text = [
    ...rule.positive.map(x => `<mi${
      base.facts[x]?.coef ? ' style="color:#00FF00"' : ''
    }>${x}</mi>`),
    ...rule.negative.map(x => `<mo>&#x00ac;</mo><mi${
      base.facts[x]?.coef? ' style="color:#00FF00"' : ''
    }>${x}</mi>`)
  ].join('<mo>&#x2227;</mo>');

  math.innerHTML = `<mrow>${text}<mo>&#x2192;</mo><mi>${resultId}</mi></mrow>`;

  mathEl.appendChild(math);
}

function drawRules(selectId) {
  const newResults = new Set();
  for (const [id, result] of Object.entries(base.results)) {
    for (const rule of result.rules) {
      if (
        rule.positive?.includes(selectId)
        || rule.negative?.includes(selectId)
      ) {
        newResults.add(id);
        selectRule(id, rule);
      }
    }
  }
  return newResults;
}

function drawAllRules() {
  selectedRules = new Set();
  mathEl.innerHTML = '';

  const selectedResults = new Set(
    Object.entries(base.facts)
      .filter(([_, fact]) => fact.coef)
      .map(([id, _]) => id)
  );
  let newResults = new Set(selectedResults);

  while (newResults.size) {
    const newResults2 = new Set();

    for (const resultId of newResults) {
      const newResults3 = drawRules(resultId);

      for (const newResult of newResults3) {
        if (!selectedResults.has(newResult)) {
          newResults2.add(newResult);
          selectedResults.add(newResult);
        }
      }
    }

    if (newResults2.size) {
      mathEl.appendChild(document.createElement('br'));
    }
    newResults = newResults2;
  }
}

const factListEl = document.getElementById('fact-list');

function onLoad(data) {
  base = data;
  factListEl.innerText = '';

  for (const [id, fact] of Object.entries(data.facts)) {
    fact.coef = 0;

    const factEl = document.createElement('span');
    factEl.classList.add('fact');
    factEl.innerText = `${id}: ${fact.name}`;

    const inputEl = document.createElement('input');
    [
      ['type', 'range'],
      ['min', '-1'],
      ['max', '1'],
      ['value', '0'],
      ['step', '0.05'],
      ['style', `accent-color: ${getRandomColor()}`],
    ].forEach(
      ([attr, value]) => inputEl.setAttribute(attr, value)
    );

    const valueEl = document.createElement('span');
    valueEl.classList.add('value');
    valueEl.innerText = '0';

    inputEl.onchange = () => {
      const {value} = inputEl;
      valueEl.innerText = value;
      fact.coef = +value;
      updateFactsCoef();
    };

    [factEl, inputEl, valueEl].forEach(
      el => factListEl.appendChild(el)
    );
  }
}

document.getElementById('file').onchange = (event) => {

  const reader = new FileReader();
  reader.onload = (e) => {
    transition(() => onLoad(JSON.parse(e.target.result)))
      .then(() => updateResults());
  };
  reader.readAsText(event.target.files[0]);
};
