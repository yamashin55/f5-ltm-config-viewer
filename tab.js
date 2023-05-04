const elOpen = document.getElementById("id_open");
const elSave = document.getElementById("id_save");
const elFile = document.getElementById("id_file");
const elText = document.getElementById("id_text");
const elLoad = document.getElementById("id_load");
const elCsv = document.getElementById("id_csv");
const elStatus = document.getElementById("id_status");
const elTab = document.getElementById("js-tab");
const elTable = document.getElementById("id_table_content");
const generateExcel = document.getElementById("id_generateExcel");
const allCheck = document.getElementById("id_allcheck");
const elVsPoolTable = document.getElementById("id_vsPoolTable");

let windowInitHeight;
let textInitHeight;
let objData = new Object();
// ---------------------------------------------
// Called when this html file is loaded.
window.onload = function () {
  // Bring the window to the top.
  chrome.windows.getCurrent({}, w => {
    chrome.windows.update(w.id, { focused: true }, () => { });
  });
  windowInitHeight = window.innerHeight;
  textInitHeight = elText.offsetHeight;
};
// ---------------------------------------------

// Synchronize the height of window and textarea.
window.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("resize", () => {
    const height = window.innerHeight - windowInitHeight + textInitHeight;
    elText.style.height = height + "px";
  });
  tabs = document.querySelectorAll('#js-tab li');
  for(i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', tabSwitch, false);
  }

  function tabSwitch(){
    tabs = document.querySelectorAll('#js-tab li');
    var node = Array.prototype.slice.call(tabs, 0);
    node.forEach(function (element) {
      element.classList.remove('active');
    });
    this.classList.add('active');

    content = document.querySelectorAll('.tab-content');
    var node = Array.prototype.slice.call(content, 0);
    node.forEach(function (element) {
      element.classList.remove('active');
    });

    const arrayTabs = Array.prototype.slice.call(tabs);
    const index = arrayTabs.indexOf(this);
    
    document.querySelectorAll('.tab-content')[index].classList.add('active');
  };
});
// ---------------------------------------------

// File Type Set
const fileTypes = [
  {
    description: "Text file",
    accept: {
      "text/plain": [".txt", ".conf"]
    }
  },
];
// ---------------------------------------------

// File open
elOpen.onclick = async () => {
  try {
    const fhArray = await window.showOpenFilePicker({ types: fileTypes });
    const fh = fhArray[0];
    elFile.value = fh.name;
    const fd = await fh.getFile();
    elText.value = await fd.text();
  }
  catch (e) { }
};
// ---------------------------------------------

// Save 
elSave.onclick = async () => {
  try {
    const fh = await window.showSaveFilePicker({ types: fileTypes, suggestedName: elFile.value });
    const ws = await fh.createWritable();
    await ws.write(elText.value);
    await ws.close();
    elFile.value = fh.name;
  }
  catch (e) { }
};
// ---------------------------------------------

// Generate Excel file
generateExcel.onclick = async () => {
  try {
    // console.log(elFile.value.split(".")[0]);
    let filename = elFile.value.split(".")[0] + ".xlsx"
    if (objData[2].length > 0) {
      items = objData[2];
      /* XLSXワークブックを作成 */
      let wb = XLSX.utils.book_new();
      const categorys = [...new Set(items.map(item => item._CATEGORY_))];
      var i = 1
      for (let category of categorys) {
        let sheetName = i + "_" + category;
        if (sheetName.length > 31) {
          sheetName = sheetName.slice(0, 31);
        }
        let arrCategoryData = items.filter(item => item._CATEGORY_ === category);
        let ws = XLSX.utils.json_to_sheet(arrCategoryData);
        try {
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        } 
        catch (e) {
          console.log(e);
        }
        ++i
      }
      /* XLSXワークブックをダウンロード */
      XLSX.writeFile(wb, filename);
    } else {
      elStatus.innerText = `...._⊂⌒~⊃｡Д｡)⊃ データが空っぽだす！`;
    }
  }
  catch (e) {
    elStatus.innerText = `...._⊂⌒~⊃｡Д｡)⊃ だめだこりゃ。${e} `;
  }
};
// ---------------------------------------------

// Start check
elLoad.onclick = async () => {
  try {
    const text = elText.value;

    if (text.length > 0) {
      // 選択範囲を改行で分割して初期値設定
      const arrayLines = text.split('\n');
      const endLineNum = arrayLines.length;
      let resultText = '';

      // First Keyを取得
      let keyNames = new Object();
      keyNames = funGetKeys(arrayLines, endLineNum, keyNames);

      // オブジェクトに変換
      objData = funReplaceObj(arrayLines, endLineNum, keyNames, objData);

      // CSVに変換
      resultCsv = funObjToCsv(objData[1]);

      // 連想配列をテーブルに変換する処理
      resultTable = funObjToTable(objData[1]);

      // CSVとTableデータをHTMLに出力
      elCsv.value = resultCsv;
      elTable.innerHTML = resultTable;

      //処理終わり
      elStatus.innerText = "...._⊂⌒~⊃｡Д｡)⊃ おわたょ！ ";
    }

    // テーブルのフィルター機能
    $(document).ready(function() {
      function searchTables(category) {
        var tableId = '#id_Table_' + category;
        // console.log(tableId);
        var table1 = $(tableId).DataTable({
          lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
        });
        var globalRegex = false; // 初期状態は正規表現検索オフ
        $("#searchInput").on("keyup", function() {
          var regex = globalRegex ? true : false; // 正規表現検索のオン・オフを判断
          table1.search(this.value, regex).draw();
        });
        // チェックボックスで正規表現検索のオン・オフを切り替える
        $(".global_filter").on("click", function() {
          globalRegex = $("#global_regex").is(":checked");
          table1.search($("#searchInput").val(), globalRegex).draw();
        });
      }
    
      var categorys = [...new Set(objData[1].map(item => item._CATEGORY_))];;
      for (var i = 0; i < categorys.length; i++) {
        searchTables(categorys[i]);
      }
      // スクロール時に検索窓 Search All を上部に固定する
      $(window).scroll(function(){
        if ($(this).scrollTop() > 70) {
          $('.searchall').css({
            'position':'fixed',
            'top':'0',
            'right':'10px'
          });
        } else {
          $('.searchall').css({
            'position':'fixed',
            'top':'70px',
            'right':'10px'
          });
        }
      });

    });

    // Replace to HTML Table
    // 連想配列をHTMLのテーブルに変換する処理
    function funObjToTable(items) {

      class TableMaker{
        // jsonはオブジェクトの配列
        static make({tableId = null, json = null, headers = []} = {}){
          const table = document.getElementById(tableId);
          if(typeof json === 'string') json = JSON.parse(json);
          // table.innerHTML = this.build(json, headers);
          return this.build(json, headers);
        }
        static build(json, headers){
          const rows = json.map(row => {
            if(headers.length === 0) headers = Object.keys(row);
            const tdsStr = headers.map(h => {
              let v = row[h];
              if(h === 'THUMBNAIL') v = `<img src="${v}">`;
              v = v.replace(/ } \//g, ' } <br>/');  // HTML用のテーブル内で改行追加
              return `<td class="${h}">${v}</td>`;
            }).join('')
            return `<tr>${tdsStr}</tr>`;
          });
          const thsStr = headers.map(h => `<th class="${h}">${h}</th>`).join('');
          const rowsStr = rows.join('');
          return `<thead><tr>${thsStr}</tr></thead><tbody>${rowsStr}</tbody>`;
        }
      }

      let resultTable = "";
      const categorys = [...new Set(items.map(item => item._CATEGORY_))];
      // console.log(categorys) '#'.repeat(10)
      for (let category of categorys) {
          // console.log(category);
          let arrCategoryData = items.filter(item => item._CATEGORY_ === category);
          head = `<label><input type="checkbox" class="category-chk" id="${category}">${category} </label><br>
          <div class="table-div"><table class="tableclass" id="id_Table_${category}" style="display: inline;">`;
          resultTable = resultTable + head + (TableMaker.make({tableId: `id_Table_${category}`, json: arrCategoryData})) + '</table></div><br>';
          // console.log(resultTable);
      }
      return resultTable;
    }

    // Replace to CSV
    // 連想配列をCSVに変換する処理
    function funObjToCsv(items) {
      resultCsv = "";
      const categorys = [...new Set(items.map(item => item._CATEGORY_))];
      // console.log(categorys) '#'.repeat(10)
      for (let category of categorys) {
          // console.log(category);
          let arrCategoryData = items.filter(item => item._CATEGORY_ === category)
          resultCsv = resultCsv + '#'.repeat(category.length+4) + '\r\n' +
                      '# ' + category + ' #\r\n' + '#'.repeat(category.length+4) + '\r\n' +
                      (arrayToCSV(arrCategoryData)) + '\r\n';
          // console.log(resultCsv);
      }
      return resultCsv;
      // return arrayToCSV(items);
      function arrayToCSV(objArray) {
          const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
          let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

          return array.reduce((str, next) => {
              str += `${Object.values(next).map(value => `${value}`).join(",")}` + '\r\n';
              return str;
              }, str);
      }
    }

    // Replace Config to Object
    // bigip.confをパースして配列、オブジェクトに格納する
    function funReplaceObj(arrayLines, endLineNum, keyNames, objData) {
      arrayData = [];
      arrayDataExl = [];
      Array.prototype.myJoin = function(seperator,start,end){
          if(!start) start = 0;
          if(!end) end = this.length - 1;
          end++;
          return this.slice(start,end).join(seperator);
      };

      for (let currentLineNum = 0; currentLineNum < endLineNum; ++currentLineNum) {
          // 現在の行を代入
          let curentText = arrayLines[currentLineNum];
          // 先頭が「XXXX」で、行末が「  {」の場合に処理
          if (curentText.match(/^\S.*{$/g)){
              // }までの終了位置を確認
              let endStanzaNum = funGetEndStanza(arrayLines, currentLineNum);
              // 1行の題名を取得
              let topname = arrayLines[currentLineNum].split(" ");
              
              // カテゴリ名を設定(ltm_virtual, ltm_node, ltm_pool)
              let keycategory = ""
              for (const elem of topname) {
                  if (elem.match(/^\/.*|^\{.*/g)) {
                      break;
                  }
                  if (keycategory === "") {
                      keycategory = elem;
                  } else {
                      keycategory = keycategory + "_" + elem;
                  }
              }

              // 検索Keyを取得
              let keys = Object.keys(keyNames[0]);
              // 検索KeyをカテゴリでGrepしてソート
              var regexp = new RegExp('^' + keycategory + '\\.' + '.*', 'g');
              keys = keys.filter(function(value) { return value.match(regexp); });
              keys.sort();
              // Object変換処理
              var data = [];
              let exldata = [];
              // オブジェクト名,カテゴリ名を入れる
              data['_CATEGORY_'] = keycategory;
              exldata['_CATEGORY_'] = keycategory;
              // console.log(keycategory + '._NAME : ' + topname[2]);
              if (topname[2] === '{'){
                  data[keycategory + '._NAME'] = topname[1];
                  exldata[keycategory + '._NAME'] = topname[1];
              } else {
                  // data[keycategory + '._NAME'] = topname[2];
                  data[keycategory + '._NAME'] = topname[topname.length - 2]
                  exldata[keycategory + '._NAME'] = topname[topname.length - 2]
              }

              // 1行下からスタート
              ++currentLineNum;
              // iRuleの場合は別処理
              if (keycategory === 'ltm_rule') {
                  // iRule文の最終行を取得
                  let endStanzaSecondNum = funGetEndStanza(arrayLines, currentLineNum);
                  // マージ用の箱を作成
                  let merged = [];
                  // 先頭に"をセット
                  let str = '" ';
                  for (let i = currentLineNum; i <= endStanzaSecondNum; ++i) {
                      // iRule文最後に"をセット
                      if (i === endStanzaSecondNum) {
                          str = str + arrayLines[i] + ' "';
                          merged[merged.length] = str;
                      } else {
                          str = str + arrayLines[i] + '\r\n';
                      }
                  }
                  flag = 0;
                  // console.log('ltm_rule.rule-string : ' + merged[0]);
                  // outputWindow.appendLine(`ltm_rule.rule-string: ${merged[0]}`);
                  data['ltm_rule.rule-string'] = merged[0];
                  exldata['ltm_rule.rule-string'] = merged[0];
                  // カレント行は最終行み設定
                  currentLineNum = endStanzaNum;
                  // データ書き込み
                  objData[topname[2]] = data;
                  arrayData.push(data);
                  arrayDataExl.push(exldata);

              // iRule以外の処理
              } else {
                  for (let x = 0; x < keys.length; ++x) {
                      let key = keys[x].split(".");
                      let flag = 1;
                      for (let i = currentLineNum; i < endStanzaNum; ++i) {
                          // var arrayWords = arrayLines[i].split(" ");
                          let arrayWords = splitNicely(arrayLines[i]);
                          if (key[1] === arrayWords[4]) {

                              // 末尾に { がある場合
                              if (arrayWords.slice(-1)[0] === '{') {
                                  let endStanzaSecondNum = funGetEndStanza(arrayLines, i);
                                  let merged = [];
                                  
                                  merged[0] = arrayLines[i];
                                  // let str = '"';  // 文字列を" "で囲む。先頭のダブルクォーテーション
                                  let str = '';
                                  ++i;
                                  for (let y = i; y <= endStanzaSecondNum; ++y) {
                                      if (y === endStanzaSecondNum) {
                                          // str = str + '"';  // 文字列を" "で囲む。後ろのダブルクォーテーション
                                          str = str + '';
                                          merged[merged.length] = str;
                                          merged[merged.length] = arrayLines[y].replace(/  +/g, ' ');
                                      }
                                      str = str + arrayLines[y].replace(/    +/g, '');
                                      if (y !== endStanzaSecondNum - 1) {
                                          str = str + " ";
                                      }
                                  }
                                  // console.log(key[1] + ': ' + merged[1]);
                                  data[key[0] + '.' + key[1]] = merged[1];
                                  if (merged[0].match(/.* members {$|.* profiles {$/g)) {
                                    exldata[key[0] + '.' + key[1]] = merged[1].replace(/ } \//g, ' } \r\n\/');
                                  } else {
                                    exldata[key[0] + '.' + key[1]] = merged[1];
                                  }
                                  i = endStanzaSecondNum;
                                  flag = 0;
                                  break;
                              
                              // { }がない場合
                              } else {
                                  if (arrayWords.slice(-1)[0] === '}') {
                                      let start = arrayWords.indexOf('{');
                                      let end = arrayWords.indexOf('}');
                                      let str = arrayWords.myJoin(" ",start,end);
                                      data[key[0] + '.' + key[1]] = str;
                                      exldata[key[0] + '.' + key[1]] = str;
                                      // outputWindow.appendLine(`${[key[0]]}.${[key[1]]}: ${str}`);
                                  } else  if (arrayWords[5]) {
                                      // console.log(key[1] + ': ' + arrayWords[5]);
                                      // outputWindow.appendLine(`${[key[0]]}.${[key[1]]}: ${arrayWords[5]}`);
                                      data[key[0] + '.' + key[1]] = arrayWords[5];
                                      exldata[key[0] + '.' + key[1]] = arrayWords[5];
                                  } else {
                                      // console.log(key[1] + ': ' + key[1]);
                                      // outputWindow.appendLine(`${[key[0]]}.${[key[1]]}: ${key[1]}`);
                                      data[key[0] + '.' + key[1]] = key[1];
                                      exldata[key[0] + '.' + key[1]] = key[1];
                                  }
                                  flag = 0;
                                  break;
                              }
                          } else {
                              flag = 1;
                          }
                      }
                      if (flag) {
                          // console.log(key[1] + ': N/A');
                          // outputWindow.appendLine(`${[key[0]]}: N/A`);
                          data[key[0] + '.' + key[1]] = "N/A";
                          exldata[key[0] + '.' + key[1]] = "N/A";
                      }
                  }
                  currentLineNum = endStanzaNum;
                  // データ書き込み
                  objData[topname[2]] = data;
                  arrayData.push(data);
                  arrayDataExl.push(exldata);
                  // console.log(objData);
              }
          }
      }
      return [objData, arrayData, arrayDataExl];
    }

    // Stanza {...} 終了位置のチェック
    function funGetEndStanza(arrayLines, currentLineNum) {
        let startLine = currentLineNum;
        let closeLineNum = 0
        startLine +=1;
        let stanza = 1;
        for (let i = startLine; stanza >= 1; ++i) {
            for (let s of arrayLines[i]) {
                if (s === '{') {
                    stanza += 1;
                } else if (s === '}') {
                    stanza -= 1;
                }
            }
            ++closeLineNum;
        }
        return closeLineNum + currentLineNum;
    }

    // 行を跨ぐ {...} を1行にする。OneLine処理
    function fuOneLine(arrayLines, currentLineNum) {
        let resultOneLineText = '';
        let endStanzaNum = funGetEndStanza(arrayLines, currentLineNum);
        for (let i = currentLineNum; i <=endStanzaNum; ++i) {
            if (i === endStanzaNum) {
                resultOneLineText += arrayLines[i] + '\r\n';
            } else {
                resultOneLineText += arrayLines[i];
            }
        }
        return [endStanzaNum, resultOneLineText];
    }

    // key を取得する
    function funGetKeys(arrayLines, endLineNum, keyNames) {
      Array.prototype.myJoin = function(seperator,start,end){
          if(!start) start = 0;
          if(!end) end = this.length - 1;
          end++;
          return this.slice(start,end).join(seperator);
      };

      for (let currentLineNum = 0; currentLineNum < endLineNum; ++currentLineNum) {
        let curentText = arrayLines[currentLineNum];
        if (curentText.match(/^ltm rule.*{$/g)){
          let endStanzaNum = funGetEndStanza(arrayLines, currentLineNum);
          let topname = arrayLines[currentLineNum].split(" ")
          topname = topname[0] + "_" + topname[1];
          keyNames[topname + ".rule-string"] = topname;
          currentLineNum = endStanzaNum;
        } else if (curentText.match(/^\S.*{$/g)){
          let endStanzaNum = funGetEndStanza(arrayLines, currentLineNum);
          let topnames = arrayLines[currentLineNum].split(" ")
          // let topname = topname[0] + "_" + topname[1];
          let topname = ""
          for (const elem of topnames) {
            if (elem.match(/^\/.*|^\{.*/g)) {
              break;
            }
            if (topname === "") {
              topname = elem;
            } else {
              topname = topname + "_" + elem;
            }
          }
          // topname = topname[0] + "_" + topname[1];
          // console.log(topname);
            
          for (let i = 0; currentLineNum < endStanzaNum; ++i) {
              var arrayWords = arrayLines[currentLineNum].split(" ");
              if (i === 0) {
                // keyNames[topname + ".name"] = topname;
                ++currentLineNum
                continue;
              } else {
                if (arrayWords.slice(-1)[0] === '{') {
                  keyNames[topname + "." + arrayWords[4]] = topname;
                  currentLineNum = funGetEndStanza(arrayLines, currentLineNum);
                } else {
                  keyNames[topname + "." + arrayWords[4]] = topname;
                }
              }
              // console.log(keyNames);
              ++currentLineNum
          }
        }
      }
      return [keyNames];
    }
    
    // 文字列を半角スペースで区切る。ダブルクォートの内側は区切らない。
    function splitNicely(str) {
        if (str !== String(str)) {
            return [str];
        }
        const arr = [];
        let buff = '';
        let escaped = false;
        let quoted = false;
        for (let i = 0, len = str.length; i < len; ++i) {
            const c = str.charAt(i);
            // if (c === '\\') {
            //     escaped = true;
            // } else {
                if (!escaped && c === '"') {
                    const prev = str.charAt(i - 1);
                    const next = str.charAt(i + 1);
                    if (!quoted && (prev === '' || prev === ' ')) {
                        quoted = true;
                    } else if (quoted && (next === '' || next === ' ')) {
                        quoted = false;
                    } else {
                        buff += c;
                    }
                } else if (!quoted && c === ' ') {
                    arr.push(buff);
                    buff = '';
                } else {
                    buff += c;
                }
                escaped = false;
            // }
        }
        arr.push(buff);
        return arr;
    }

  }
  catch (e) { console.log(e); }
};
// ---------------------------------------------

// Click Event
document.addEventListener('click', (e) => {
  // チェックボックスに応じた表示、非表示
  if (e.target.className === "category-chk") {
    const id = e.target.id;
    const table = `id_Table_${id}_wrapper`;

    if (document.getElementById(`${id}`).checked){
      // 非表示
      document.getElementById(table).style.display = 'inline'
    }else{
      // 表示
      document.getElementById(table).style.display = 'none'
    }  
  }
  // ---------------------------------------------
  // 全選択/全解除 ボタン
  if (e.target.id === "id_allcheck") {
    const checkbox3 = document.getElementsByClassName("category-chk")
    const trueorfalse = checkbox3[1].checked
    for(i = 0; i < checkbox3.length; i++) {
      const id = checkbox3[i].id;
      const table = `id_Table_${id}_wrapper`;
      
      if (trueorfalse){
        checkbox3[i].checked = false
        document.getElementById(table).style.display = 'none';
      } else {
        checkbox3[i].checked = true
        document.getElementById(table).style.display = 'inline'; 
      }
    }
  }
  // ---------------------------------------------
  // Get VS and PoolMember ボタン
  try {
    if (e.target.id === "id_mapping") {
      var table_vs = $('#id_Table_ltm_virtual').DataTable();
      var table_pool = $('#id_Table_ltm_pool').DataTable();
      var vsData = table_vs.rows().data().toArray();
      var poolData = table_pool.rows().data().toArray();
      var poolTableMemberColumnIndex = -1; // 列番号の初期値
      var poolHeader = table_pool.columns().header();
      poolHeader.each(function(header, index) {
        if (header.textContent === 'ltm_pool.members') { // Pool_Member列が見つかった場合
          poolTableMemberColumnIndex = index; // 列番号を保存
          return false; // each()を抜ける
        }
      });
      var vsTablePoolColumnIndex = -1; // 列番号の初期値
      var vsTableDestAddrColumnIndex = -1; // 列番号の初期値
      var vsHeader = table_vs.columns().header();
      vsHeader.each(function(header, index) {
        if (header.textContent === 'ltm_virtual.pool') { // Virtual_Server_Pool列が見つかった場合
          vsTablePoolColumnIndex = index; // 列番号を保存
          return false; // each()を抜ける
        } else if (header.textContent === 'ltm_virtual.destination') { // Virtual_Server_Address列が見つかった場合
          vsTableDestAddrColumnIndex = index; // 列番号を保存
          return false; // each()を抜ける
        }
      });
      var headTable = `<thead><tr><th>Virtual_Server_NAME</th><th>Virtual_Server_Address</th><th>Virtual_Server_Pool</th><th>Pool_Member</th></tr></thead><tbody>`
      var bodyTable = ""
      var foodTable = "</tbody>"
      var table = ""
      vsData.forEach(function(vs) {
        var pool = poolData.find(function(p) { return p[1] === vs[vsTablePoolColumnIndex]; });
        if (pool) {
          var poolMember = pool[poolTableMemberColumnIndex];
          bodyTable = bodyTable + `<tr><td>${vs[1]}</td><td>${vs[vsTableDestAddrColumnIndex]}</td><td>${vs[vsTablePoolColumnIndex]}</td><td>${poolMember}</td></tr>`
        }
      });
      table =  headTable + bodyTable + foodTable
      elVsPoolTable.innerHTML = table;
    }

  }
  catch (e) { console.log(e); }
});
// ---------------------------------------------
// try {
// }
// catch (e) { console.log(e); }