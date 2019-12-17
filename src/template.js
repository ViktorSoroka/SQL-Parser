import {
 compact, forIn, each 
} from 'lodash';

const template = ({
 table_name, item 
}) => {
  const rows = [];
  const cols = [];

  forIn(compact(item)[0], (column, key) => {
    cols.push(`<th>${key}</th>`);
  });

  each(item, row => {
    const columns = [];

    forIn(row, col => {
      columns.push(`<td>${col}</td>`);
    });

    rows.push(`<tr>${columns.join('')}</tr>`);
  });

  return `
    <table class="table table-condensed">
      <caption class="text-center">${table_name}</caption>
      <thead>
        <tr>${cols.join('')}</tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `;
};

export default template;
