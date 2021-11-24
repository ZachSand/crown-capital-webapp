(function($) {

  $(function() {

    let collapse = $('.collapse');

    // Landing page div is always the first page of the website
    let currentShowingDiv = $('#landing-page');

    let portfolioDataPopulated = false;

    // Hides all but the selected div. Allows for the feel of multiple pages in a single page without scrolling
    collapse.on('shown.bs.collapse', function() {
      currentShowingDiv = $(this);

      if ($(this).attr('id') !== 'navbarNavDropdown') {
        collapse.not($(this)).collapse('hide');
      }

      // Modify DOM with portfolio data, use simple boolean to make sure it only happens once
      if (!portfolioDataPopulated && portfolioData.length !== 0) {
        fillPortfolioData();
        portfolioDataPopulated = true;
      }
    });

    // Prevent removing a div if it is the same div already showing
    collapse.on('hide.bs.collapse', function(event) {
      if ($(this).attr('id') === currentShowingDiv.attr('id') && $(this).attr('id') !== 'navbarNavDropdown') {
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
        if (portfolioPage && portfolioPage.length !== 0) {
          populateTableHeaders(portfolioPage, sheetData.values);
          populateTableBody(portfolioPage, sheetData.values);
        }
      }
    }

    function populateTableHeaders(portfolioPage, sheetDataValues) {
      let domTableHeaders = portfolioPage.find('thead');
      let sheetRowWithoutHyperlink = sheetDataValues.filter(sheetRow => sheetRow.length >= 2 && !sheetRow[0].includes('HYPERLINK'));

      if (domTableHeaders.length !== sheetRowWithoutHyperlink.length) {
        return;
      }

      const tableHeaderAttributes = 'scope=\'col\' class=\'w-75\'';
      for (let domTableHeaderIndex = 0; domTableHeaderIndex < domTableHeaders.length; domTableHeaderIndex++) {
        let tableHeaderRow = $('<tr>').appendTo(domTableHeaders[domTableHeaderIndex]);
        for (let sheetHeaderColumnIndex = 0; sheetHeaderColumnIndex < sheetRowWithoutHyperlink[domTableHeaderIndex].length; sheetHeaderColumnIndex++) {
          tableHeaderRow.append('<th ' + tableHeaderAttributes + '>' + sheetRowWithoutHyperlink[domTableHeaderIndex][sheetHeaderColumnIndex] + '</th>');
        }
        domTableHeaders.append('</tr>');
      }
    }

    function populateTableBody(portfolioPage, sheetDataValues) {
      let tableBodies = portfolioPage.find('tbody');
      let currentSheetDataRow = 1;
      for (let tableBodyCount = 0; tableBodyCount < tableBodies.length; tableBodyCount++) {
        let foundHeader = false;
        while (!foundHeader && currentSheetDataRow < sheetDataValues.length) {
          if (sheetDataValues[currentSheetDataRow][0].includes('HYPERLINK')) {
            let tableBodyRow = $('<tr>').appendTo(tableBodies[tableBodyCount]);
            let sheetDataRow = sheetDataValues[currentSheetDataRow];

            for (let tableCol = 0; tableCol < sheetDataRow.length; tableCol++) {
              let colData = sheetDataRow[tableCol];
              if (colData.toString().includes('HYPERLINK')) {
                let hyperlinkData = sheetDataRow[0].split('\"');
                colData = '<a class=\'off-white-text\' href=\'' + hyperlinkData[1] + '\' target=\'_blank>\'>';
                if (portfolioPage.attr('id').toLowerCase().includes('escrow')) {
                  colData += '<i class="fas fa-wallet pe-2"></i>';
                }
                colData += hyperlinkData[3] + '</a>';
              }
              tableBodyRow.append('<td class=\'off-white-text\'>' + colData + '</td>');
            }
          } else {
            foundHeader = true;
          }
          currentSheetDataRow++;
        }
      }
    }
  });


  const googleSheetsBaseURL = 'https://sheets.googleapis.com/v4/spreadsheets/';
  const spreadsheetId = '1cszCpT5bIqWKoQ1vEAe7BkOQpxzC3n3Wx3IVc2Z-Xrg/';
  const valuesEndpoint = 'values/';
  const sheetRange = '!A1:B50';
  const apiKeyParam = '?key=AIzaSyCWpzF7zF1Dgk3I9G2Gbf0lfg7zs7gA7GI';
  const valueRenderOptionParam = '&valueRenderOption=FORMULA';

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


})
(jQuery);