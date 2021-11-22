(function($) {

  $(function() {

    let collapse = $('.collapse');

    // Landing page div is always the first page of the website
    let currentShowingDiv = $('#landing-page');

    let portfolioDataPopulated = false;

    // Hides all but the selected div. Allows for the feel of multiple pages in a single page without scrolling
    collapse.on('shown.bs.collapse', function() {
      currentShowingDiv = $(this);
      $('.collapse').not($(this)).collapse('hide');

      // Modify DOM with portfolio data, use simple boolean to make sure it only happens once
      if (!portfolioDataPopulated && portfolioData.length !== 0) {
        fillPortfolioData();
        portfolioDataPopulated = true;
      }
    });

    // Prevent removing a div if it is the same div already showing
    collapse.on('hide.bs.collapse', function(event) {
      if ($(this).attr('id') === currentShowingDiv.attr('id')) {
        event.preventDefault();
        event.stopPropagation();
        $(this).collapse('show');
      }
    });

    function fillPortfolioData() {
      if (portfolioData.length === 0) {
        return;
      }

      for (const [portfolioPageId, sheetData] of portfolioData.entries()) {
        let portfolioPage = $('#' + portfolioPageId);
        let sheetDataValues = sheetData.values;

        // Add table header rows based on data from the first row of the sheet
        let tableHeader = portfolioPage.find('thead');
        let tableHeaderRow = $('<tr>').appendTo(tableHeader);
        if (sheetDataValues.length !== 0) {
          for (let headerCol = 0; headerCol < sheetDataValues[0].length; headerCol++) {
            tableHeaderRow.append('<th scope=\'col\' class=\'fs-5 fw-bold\'>' + sheetData.values[0][headerCol] + '</th>');
          }
        }
        tableHeader.append('</tr>');

        let tableBody = portfolioPage.find('tbody');
        for (let row = 1; row < sheetDataValues.length; row++) {
          let tableBodyRow = $('<tr>').appendTo(tableBody);
          let sheetDataRow = sheetDataValues[row];

          for (let tableCol = 0; tableCol < sheetDataRow.length; tableCol++) {
            let colData = sheetDataRow[tableCol];
            if (colData.toString().includes('HYPERLINK')) {
              let hyperlinkData = sheetDataRow[0].split('\"');
              colData = '<a class=\'off-white-text fs-5\' href=\'' + hyperlinkData[1] + '\' target=\'_blank>\'>';
              if (portfolioPageId.toLowerCase().includes('escrow')) {
                colData += '<i class="fas fa-wallet pe-2"></i>';
              }
              colData += hyperlinkData[3] + '</a>';
            }
            tableBodyRow.append('<td class=\'off-white-text fs-5\'>' + colData + '</td>');
          }

          tableBody.append('</tr>');
        }
      }
    }
  });


  let googleSheetsBaseURL = 'https://sheets.googleapis.com/v4/spreadsheets/';
  let spreadsheetId = '1cszCpT5bIqWKoQ1vEAe7BkOQpxzC3n3Wx3IVc2Z-Xrg/';
  let valuesEndpoint = 'values/';
  let sheetRange = '!A1:B50';
  let apiKeyParam = '?key=AIzaSyCWpzF7zF1Dgk3I9G2Gbf0lfg7zs7gA7GI';
  let valueRenderOptionParam = '&valueRenderOption=FORMULA';

  function isCrownCapitalSpreadsheet(data) {
    return data
      && data.hasOwnProperty('properties')
      && data.properties.hasOwnProperty('title')
      && data.properties.title.toLowerCase().includes('crown capital');
  }

  const portfolioData = new Map();

  $.get(googleSheetsBaseURL + spreadsheetId + apiKeyParam, function(spreadsheetData) {
    if (isCrownCapitalSpreadsheet(spreadsheetData) && spreadsheetData.hasOwnProperty('sheets')) {
      spreadsheetData.sheets.forEach(sheet => {
        if (sheet.hasOwnProperty('properties') && sheet.properties.hasOwnProperty('title')) {
          $.get(googleSheetsBaseURL + spreadsheetId + valuesEndpoint + sheet.properties.title + sheetRange + apiKeyParam + valueRenderOptionParam, function(sheetData) {
            if (sheetData.hasOwnProperty('values') && sheetData.values.length) {
              let portfolioDivId = sheet.properties.title.toLowerCase().replaceAll(' ', '-') + '-page';
              portfolioData.set(portfolioDivId, sheetData);
            }
          });
        }
      });
    }
  })
    .fail(function() {
      console.error('Failed to load Portfolio data!');
    });


})(jQuery);