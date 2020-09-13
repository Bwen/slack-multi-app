const SPACE_SEPARATOR_AMOUNT = 4;

function calculateTextMaxWidth(texts) {
  let maxWidth = 0;
  texts.forEach((text) => {
    let width = 0;
    if (Array.isArray(text)) {
      width = calculateTextMaxWidth(text);
    } else {
      width = text.length;
    }

    if (maxWidth < width) {
      maxWidth = width;
    }
  });

  return maxWidth;
}

/**
 * Calculates an array of text max width according to the provided data
 *
 * @param data
 * @returns {[int]}
 */
function getColumnsWidth(data) {
  const columnsWidth = [];
  const numberOfColumns = data[0].length;
  for (let i = 0; i < numberOfColumns; i += 1) {
    const columnData = data.map((item) => item[i]);
    columnsWidth.push(calculateTextMaxWidth(columnData) + SPACE_SEPARATOR_AMOUNT);
  }

  return columnsWidth;
}

/**
 * Formats the columns as a grid list in a raw message
 *
 * @param data
 * @returns {string}
 */
function renderList(data) {
  const columnWidths = getColumnsWidth(data);
  const totalWidth = columnWidths.reduce((a, b) => a + b);
  const separator = '-'.repeat(totalWidth);
  const numberOfColumns = data[0].length;
  let list = '';
  data.forEach((item, n) => {
    let hasMultipleLines = false;
    for (let i = 0; i < numberOfColumns; i += 1) {
      let spacers = ' '.repeat(columnWidths[i] - item[i].length);
      let text = item[i];
      if (Array.isArray(item[i])) {
        [text] = item[i];
        spacers = ' '.repeat(columnWidths[i] - text.length);

        if (item[i].length > 1) {
          hasMultipleLines = true;
        }
      }

      if (i === (numberOfColumns - 1)) {
        spacers = '';
      }

      list += `${text}${spacers}`;
    }
    list += '\n';

    // if we have extra lines we process them
    if (hasMultipleLines) {
      const lastColumnIndex = item.length - 1;
      for (let j = 1; j < item[lastColumnIndex].length; j += 1) {
        for (let i = 0; i < numberOfColumns; i += 1) {
          if (!Array.isArray(item[i])) {
            list += ' '.repeat(columnWidths[i]);
            // eslint-disable-next-line no-continue
            continue;
          }

          let spacers = ' '.repeat(columnWidths[i] - item[i][j].length);
          if (i === (numberOfColumns - 1)) {
            spacers = '';
          }

          list += `${item[i][j]}${spacers}`;
        }
        list += '\n';
      }
    }

    // If we just rendered the header, we put a separator from the values
    if (n === 0) {
      list += `${separator}\n`;
    }
  });

  return `\`\`\`${list}\`\`\``;
}

module.exports = {
  /**
   * Formats the columns as a grid list
   *
   * @param data
   * @returns {string}
   */
  renderList: (data) => renderList(data),
};
