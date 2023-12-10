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
  const categories = values.map(v => v.name);
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
        opt.w.globals.labels[opt.dataPointIndex] + ":  " + val,
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
  const categories = values.map(v => v.name);
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
}

function updateFactsCoef() {
  for (const result of Object.values(base.results)) {
    result.coef = null;
  }
  for (const key in base.results) {
    coefFromKey(key);
  }
  console.log(base);
  updateChartValues();
}

const factListEl = document.getElementById('fact-list');

function onLoad(data) {
  base = data;
  factListEl.innerText = '';

  for (const fact of Object.values(data.facts)) {
    fact.coef = 0;

    const factEl = document.createElement('span');
    factEl.classList.add('fact');
    factEl.innerText = fact.name;

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
