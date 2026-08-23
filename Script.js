/* =========================================================
   MYFINANCE
   Portfolio Tracker
   Trading USD + Investment IDR
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "myfinance_final_v1";


/* =========================================================
   DEFAULT AVATAR
========================================================= */

const defaultAvatar =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">

      <defs>
        <linearGradient id="g"
          x1="0" y1="0"
          x2="1" y2="1">
          <stop
            offset="0"
            stop-color="#17252a"/>
          <stop
            offset="1"
            stop-color="#0c1118"/>
        </linearGradient>
      </defs>

      <rect
        width="160"
        height="160"
        rx="80"
        fill="url(#g)"/>

      <circle
        cx="80"
        cy="68"
        r="40"
        fill="#43d69b"
        opacity=".13"/>

      <rect
        x="50"
        y="52"
        width="60"
        height="53"
        rx="16"
        fill="#152029"
        stroke="#43d69b"
        stroke-width="4"/>

      <circle
        cx="68"
        cy="77"
        r="6"
        fill="#43d69b"/>

      <circle
        cx="92"
        cy="77"
        r="6"
        fill="#43d69b"/>

      <path
        d="M68 92c8 6 16 6 24 0"
        fill="none"
        stroke="#43d69b"
        stroke-width="4"
        stroke-linecap="round"/>

      <path
        d="M80 52V41"
        stroke="#43d69b"
        stroke-width="4"/>

      <circle
        cx="80"
        cy="37"
        r="4"
        fill="#e8c65a"/>

      <path
        d="M45 137c8-27 62-27 70 0"
        fill="#152029"
        stroke="#43d69b"
        stroke-width="3"/>

    </svg>
  `);


/* =========================================================
   STATE
========================================================= */

let state = loadState();


let calendarCursor = {
  home: new Date(),
  profile: new Date()
};


let calendarSelected = {
  home: today(),
  profile: today()
};


let pendingDelete = {
  type: null,
  id: null
};


/* =========================================================
   HELPERS
========================================================= */

const $ = id =>
  document.getElementById(id);


function today(){

  const d = new Date();

  const year =
    d.getFullYear();

  const month =
    String(d.getMonth() + 1)
      .padStart(2,"0");

  const day =
    String(d.getDate())
      .padStart(2,"0");

  return `${year}-${month}-${day}`;
}


function uid(){

  if(
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ){

    return crypto.randomUUID();

  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


function number(value){

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;

}


function rupiah(value){

  return new Intl.NumberFormat(
    "id-ID",
    {
      style:"currency",
      currency:"IDR",
      maximumFractionDigits:0
    }
  ).format(
    number(value)
  );

}


function usd(value){

  return new Intl.NumberFormat(
    "en-US",
    {
      style:"currency",
      currency:"USD",
      minimumFractionDigits:2,
      maximumFractionDigits:2
    }
  ).format(
    number(value)
  );

}


function signedUSD(value){

  const n =
    number(value);

  if(Math.abs(n) < 0.000001){

    return "$0.00";

  }

  return n > 0
    ? `+${usd(n)}`
    : `-${usd(Math.abs(n))}`;

}


function signedRupiah(value){

  const n =
    number(value);

  if(Math.abs(n) < 0.000001){

    return "Rp 0";

  }

  return n > 0
    ? `+${rupiah(n)}`
    : `-${rupiah(Math.abs(n))}`;

}


function formatPercent(value){

  const n =
    number(value);

  if(Math.abs(n) < 0.000001){

    return "0%";

  }

  return (
    (n > 0 ? "+" : "") +
    n.toFixed(2) +
    "%"
  );

}


function escapeHTML(value){

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;

}


function initials(name){

  const text =
    String(name || "")
      .trim();

  if(!text){

    return "?";

  }

  return text
    .split(/\s+/)
    .slice(0,2)
    .map(x => x.charAt(0))
    .join("")
    .toUpperCase();

}


function formatDate(date){

  if(!date){

    return "-";

  }

  const d =
    new Date(
      date + "T00:00:00"
    );

  return d.toLocaleDateString(
    "id-ID",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  );

}


/* =========================================================
   STATE
========================================================= */

function defaultState(){

  return {

    profile:{
      name:"Pengguna",
      bio:"Trader & investor",
      avatar:defaultAvatar
    },

    settings:{
      tradingCapitalUSD:0,
      investmentCapitalIDR:0,
      exchangeRate:16000
    },

    trading:[],

    investments:[]

  };

}


function loadState(){

  try{

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if(!raw){

      return defaultState();

    }

    return normalizeState(
      JSON.parse(raw)
    );

  }catch(error){

    console.warn(
      "State tidak dapat dibaca:",
      error
    );

    return defaultState();

  }

}


function normalizeState(data){

  const base =
    defaultState();


  const profile =
    data?.profile || {};


  const settings =
    data?.settings || {};


  return {

    profile:{

      name:
        String(
          profile.name ||
          base.profile.name
        ),

      bio:
        String(
          profile.bio ||
          base.profile.bio
        ),

      avatar:
        profile.avatar ||
        defaultAvatar

    },


    settings:{

      tradingCapitalUSD:
        Math.max(
          0,
          number(
            settings.tradingCapitalUSD
          )
        ),

      investmentCapitalIDR:
        Math.max(
          0,
          number(
            settings.investmentCapitalIDR
          )
        ),

      exchangeRate:
        Math.max(
          1,
          number(
            settings.exchangeRate
          ) || 16000
        )

    },


    trading:
      Array.isArray(data?.trading)
        ? data.trading.map(normalizeTrading)
        : [],


    investments:
      Array.isArray(data?.investments)
        ? data.investments.map(normalizeInvestment)
        : []

  };

}


function normalizeTrading(item){

  return {

    id:
      item?.id || uid(),

    pair:
      String(item?.pair || "XAUUSD"),

    side:
      item?.side === "Sell"
        ? "Sell"
        : "Buy",

    pl:
      number(item?.pl),

    date:
      item?.date || today()

  };

}


function normalizeInvestment(item){

  return {

    id:
      item?.id || uid(),

    name:
      String(item?.name || "Aset"),

    capital:
      Math.max(
        0,
        number(item?.capital)
      ),

    returnPct:
      number(item?.returnPct),

    date:
      item?.date || today()

  };

}


function saveState(){

  try{

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    return true;

  }catch(error){

    console.error(error);

    alert(
      "Data gagal disimpan. " +
      "Coba kosongkan sedikit penyimpanan browser."
    );

    return false;

  }

}


/* =========================================================
   CALCULATIONS
========================================================= */

function tradingPL(){

  return state.trading.reduce(
    (sum,item) =>
      sum + number(item.pl),
    0
  );

}


function tradingBalance(){

  return (
    state.settings.tradingCapitalUSD +
    tradingPL()
  );

}


function investmentCapital(){

  return state.investments.reduce(
    (sum,item) =>
      sum + number(item.capital),
    0
  );

}


function investmentPL(){

  return state.investments.reduce(
    (sum,item) => {

      const capital =
        number(item.capital);

      const pct =
        number(item.returnPct);

      return sum +
        capital *
        pct /
        100;

    },
    0
  );

}


function investmentValue(){

  return (
    investmentCapital() +
    investmentPL()
  );

}


function tradingValueIDR(){

  return (
    tradingBalance() *
    state.settings.exchangeRate
  );

}


function totalAssetsIDR(){

  return (
    tradingValueIDR() +
    investmentValue()
  );

}


function totalInitialIDR(){

  return (
    state.settings.tradingCapitalUSD *
    state.settings.exchangeRate
  ) +
  state.settings.investmentCapitalIDR;

}


function totalPLIDR(){

  return (
    tradingPL() *
    state.settings.exchangeRate
  ) +
  investmentPL();

}


function overallPerformance(){

  const initial =
    totalInitialIDR();

  if(initial <= 0){

    return 0;

  }

  return (
    totalPLIDR() /
    initial
  ) * 100;

}


function investmentPerformance(){

  const capital =
    investmentCapital();

  if(capital <= 0){

    return 0;

  }

  return (
    investmentPL() /
    capital
  ) * 100;

}


function tradingPerformance(){

  const capital =
    state.settings.tradingCapitalUSD;

  if(capital <= 0){

    return 0;

  }

  return (
    tradingPL() /
    capital
  ) * 100;

}


/* =========================================================
   TONE
========================================================= */

function tone(value){

  const n =
    number(value);

  if(n > 0.000001){

    return "positive";

  }

  if(n < -0.000001){

    return "negative";

  }

  return "neutral";

}


function applyTone(element,value){

  if(!element){

    return;

  }

  element.classList.remove(
    "positive",
    "negative",
    "neutral"
  );

  element.classList.add(
    tone(value)
  );

}


function setBadge(element,value){

  if(!element){

    return;

  }

  const t =
    tone(value);

  element.className =
    `performance-badge ${t}`;

  element.textContent =
    formatPercent(value);

}


/* =========================================================
   NAVIGATION
========================================================= */

function setPage(page){

  const valid = [
    "home",
    "trading",
    "investment",
    "statistics",
    "profile"
  ];

  if(!valid.includes(page)){

    page = "home";

  }


  document
    .querySelectorAll(".page")
    .forEach(section => {

      section.classList.toggle(
        "active",
        section.id ===
          `page-${page}`
      );

    });


  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });


  window.scrollTo({
    top:0,
    behavior:"smooth"
  });


  renderPage(page);

}


/* =========================================================
   PAGE RENDER
========================================================= */

function renderPage(page){

  if(page === "home"){

    renderHome();

  }

  if(page === "trading"){

    renderTrading();

  }

  if(page === "investment"){

    renderInvestment();

  }

  if(page === "statistics"){

    renderStatistics();

  }

  if(page === "profile"){

    renderProfile();

  }

}


function renderAll(){

  renderHome();

  renderTrading();

  renderInvestment();

  renderStatistics();

  renderProfile();

}


/* =========================================================
   HOME
========================================================= */

function renderHome(){

  const avatar =
    state.profile.avatar ||
    defaultAvatar;


  $("welcomeName").textContent =
    state.profile.name;


  $("summaryName").textContent =
    state.profile.name;


  $("summaryBio").textContent =
    state.profile.bio;


  $("topAvatar").src =
    avatar;


  $("homeProfileAvatar").src =
    avatar;


  $("homeTotalAssets").textContent =
    rupiah(
      totalAssetsIDR()
    );


  $("homeTradingIDR").textContent =
    rupiah(
      tradingValueIDR()
    );


  $("homeTradingUSD").textContent =
    usd(
      tradingBalance()
    );


  $("homeInvestmentValue").textContent =
    rupiah(
      investmentValue()
    );


  $("homeInvestmentPL").textContent =
    signedRupiah(
      investmentPL()
    );


  $("homeTradingCapital").textContent =
    usd(
      state.settings.tradingCapitalUSD
    );


  $("homeInvestmentCapital").textContent =
    rupiah(
      state.settings.investmentCapitalIDR
    );


  $("homeProfit").textContent =
    rupiah(
      Math.max(
        0,
        totalPLIDR()
      )
    );


  $("homeLoss").textContent =
    rupiah(
      Math.abs(
        Math.min(
          0,
          totalPLIDR()
        )
      )
    );


  $("homePerformance").textContent =
    formatPercent(
      overallPerformance()
    );


  applyTone(
    $("homePerformance"),
    overallPerformance()
  );


  setBadge(
    $("homePerformanceBadge"),
    overallPerformance()
  );


  renderCalendar(
    "homeCalendar",
    "home"
  );


  drawLineChart(
    $("homeChart"),
    buildOverallCurve()
  );

}


/* =========================================================
   TRADING
========================================================= */

function renderTrading(){

  const balance =
    tradingBalance();

  const pl =
    tradingPL();

  const performance =
    tradingPerformance();


  $("tradingBalanceUSD").textContent =
    usd(balance);


  $("tradingBalanceIDR").textContent =
    `≈ ${rupiah(
      balance *
      state.settings.exchangeRate
    )}`;


  $("tradingCapital").textContent =
    usd(
      state.settings.tradingCapitalUSD
    );


  $("tradingPL").textContent =
    signedUSD(pl);


  applyTone(
    $("tradingPL"),
    pl
  );


  setBadge(
    $("tradingBadge"),
    performance
  );


  $("tradingCount").textContent =
    `${state.trading.length} transaksi`;


  const list =
    $("tradingList");


  if(!state.trading.length){

    list.innerHTML = `
      <div class="empty-state">

        <strong>
          Belum ada transaksi trading
        </strong>

        <p>
          Tambahkan transaksi pertama kamu.
        </p>

      </div>
    `;

  }else{

    list.innerHTML =
      state.trading
        .map(item => {

          const plValue =
            number(item.pl);

          return `

            <div class="list-item">

              <div class="item-left">

                <div class="item-icon">
                  ${escapeHTML(
                    initials(item.pair)
                  )}
                </div>

                <div>

                  <div class="item-title">
                    ${escapeHTML(
                      item.pair
                    )}
                  </div>

                  <div class="item-sub">
                    ${escapeHTML(
                      item.side
                    )}
                    ·
                    ${formatDate(
                      item.date
                    )}
                  </div>

                  <div class="item-actions">

                    <button
                      class="item-action"
                      data-edit-trading="${item.id}"
                      aria-label="Edit">

                      <svg viewBox="0 0 24 24">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z"></path>
                      </svg>

                    </button>

                    <button
                      class="item-action delete"
                      data-delete-trading="${item.id}"
                      aria-label="Hapus">

                      <svg viewBox="0 0 24 24">
                        <path d="M3 6h18"></path>
                        <path d="M8 6V4h8v2"></path>
                        <path d="M19 6l-1 15H6L5 6"></path>
                      </svg>

                    </button>

                  </div>

                </div>

              </div>


              <div
                class="item-value ${tone(
                  plValue
                )}">

                ${signedUSD(plValue)}

                <small>
                  ${rupiah(
                    plValue *
                    state.settings.exchangeRate
                  )}
                </small>

              </div>

            </div>

          `;

        })
        .join("");

  }


  drawLineChart(
    $("tradingChart"),
    buildTradingCurve()
  );

}


/* =========================================================
   INVESTMENT
========================================================= */

function renderInvestment(){

  const capital =
    investmentCapital();

  const pl =
    investmentPL();

  const value =
    investmentValue();

  const performance =
    investmentPerformance();


  $("investmentTotalValue").textContent =
    rupiah(value);


  $("investmentTotalPL").textContent =
    signedRupiah(pl);


  applyTone(
    $("investmentTotalPL"),
    pl
  );


  $("investmentCapital").textContent =
    rupiah(capital);


  $("investmentCount").textContent =
    state.investments.length;


  setBadge(
    $("investmentBadge"),
    performance
  );


  const list =
    $("investmentList");


  if(!state.investments.length){

    list.innerHTML = `
      <div class="empty-state">

        <strong>
          Belum ada instrumen
        </strong>

        <p>
          Tambahkan BBCA, BBRI, TLKM,
          atau instrumen lainnya.
        </p>

      </div>
    `;

  }else{

    list.innerHTML =
      state.investments
        .map(item => {

          const itemCapital =
            number(item.capital);

          const itemPL =
            itemCapital *
            number(item.returnPct) /
            100;

          const itemValue =
            itemCapital +
            itemPL;


          return `

            <div class="list-item">

              <div class="item-left">

                <div class="item-icon">
                  ${escapeHTML(
                    initials(item.name)
                  )}
                </div>

                <div>

                  <div class="item-title">
                    ${escapeHTML(
                      item.name
                    )}
                  </div>

                  <div class="item-sub">

                    Modal
                    ${rupiah(itemCapital)}

                    ·

                    ${formatPercent(
                      item.returnPct
                    )}

                  </div>


                  <div class="item-actions">

                    <button
                      class="item-action"
                      data-edit-investment="${item.id}"
                      aria-label="Edit">

                      <svg viewBox="0 0 24 24">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z"></path>
                      </svg>

                    </button>

                    <button
                      class="item-action delete"
                      data-delete-investment="${item.id}"
                      aria-label="Hapus">

                      <svg viewBox="0 0 24 24">
                        <path d="M3 6h18"></path>
                        <path d="M8 6V4h8v2"></path>
                        <path d="M19 6l-1 15H6L5 6"></path>
                      </svg>

                    </button>

                  </div>

                </div>

              </div>


              <div class="item-value">

                ${rupiah(itemValue)}

                <small class="${tone(
                  itemPL
                )}">

                  ${signedRupiah(
                    itemPL
                  )}

                </small>

              </div>

            </div>

          `;

        })
        .join("");

  }


  drawLineChart(
    $("investmentChart"),
    buildInvestmentCurve()
  );

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics(){

  const totalPL =
    totalPLIDR();

  const performance =
    overallPerformance();


  $("statAssets").textContent =
    rupiah(
      totalAssetsIDR()
    );


  $("statProfit").textContent =
    rupiah(
      Math.max(
        0,
        totalPL
      )
    );


  $("statLoss").textContent =
    rupiah(
      Math.abs(
        Math.min(
          0,
          totalPL
        )
      )
    );


  $("statPerformance").textContent =
    formatPercent(
      performance
    );


  applyTone(
    $("statPerformance"),
    performance
  );


  if(performance > 0){

    $("statPerformanceText").textContent =
      "Portfolio sedang bertumbuh";

  }else if(performance < 0){

    $("statPerformanceText").textContent =
      "Portfolio sedang mengalami penurunan";

  }else{

    $("statPerformanceText").textContent =
      "Belum ada perubahan";

  }


  $("statTradingPL").textContent =
    signedUSD(
      tradingPL()
    );


  applyTone(
    $("statTradingPL"),
    tradingPL()
  );


  $("statInvestmentPL").textContent =
    signedRupiah(
      investmentPL()
    );


  applyTone(
    $("statInvestmentPL"),
    investmentPL()
  );


  $("statActivity").textContent =
    state.trading.length +
    state.investments.length;


  drawBarChart(
    $("statisticsChart"),
    [
      Math.max(0,totalPL),
      Math.abs(
        Math.min(
          0,
          totalPL
        )
      ),
      Math.abs(totalPL)
    ],
    performance
  );

}


/* =========================================================
   PROFILE
========================================================= */

function renderProfile(){

  const avatar =
    state.profile.avatar ||
    defaultAvatar;


  $("profileAvatar").src =
    avatar;


  $("profileNameInput").value =
    state.profile.name;


  $("profileBioInput").value =
    state.profile.bio;


  $("tradingCapitalInput").value =
    state.settings.tradingCapitalUSD ||
    "";


  $("investmentCapitalInput").value =
    state.settings.investmentCapitalIDR ||
    "";


  $("exchangeRateInput").value =
    state.settings.exchangeRate;


  renderCalendar(
    "profileCalendar",
    "profile"
  );

}


/* =========================================================
   TRADING FORM
========================================================= */

function resetTradingForm(){

  const form =
    $("tradingForm");

  form.reset();

  form.elements.id.value =
    "";

  form.elements.date.value =
    today();

  $("tradingModalTitle").textContent =
    "Tambah Transaksi";

}


function openTradingEditor(id = null){

  const form =
    $("tradingForm");


  form.reset();


  if(id){

    const item =
      state.trading.find(
        x => x.id === id
      );

    if(!item){

      return;

    }


    form.elements.id.value =
      item.id;

    form.elements.pair.value =
      item.pair;

    form.elements.side.value =
      item.side;

    form.elements.result.value =
      number(item.pl) >= 0
        ? "profit"
        : "loss";

    form.elements.amount.value =
      Math.abs(
        number(item.pl)
      );

    form.elements.date.value =
      item.date;

    $("tradingModalTitle").textContent =
      "Edit Transaksi";

  }else{

    resetTradingForm();

  }


  openModal(
    "tradingModal"
  );

}


/* =========================================================
   INVESTMENT FORM
========================================================= */

function resetInvestmentForm(){

  const form =
    $("investmentForm");

  form.reset();

  form.elements.id.value =
    "";

  form.elements.date.value =
    today();

  $("investmentModalTitle").textContent =
    "Tambah Investasi";

}


function openInvestmentEditor(id = null){

  const form =
    $("investmentForm");


  form.reset();


  if(id){

    const item =
      state.investments.find(
        x => x.id === id
      );

    if(!item){

      return;

    }


    form.elements.id.value =
      item.id;

    form.elements.name.value =
      item.name;

    form.elements.capital.value =
      item.capital;

    form.elements.returnPct.value =
      item.returnPct;

    form.elements.date.value =
      item.date;

    $("investmentModalTitle").textContent =
      "Edit Investasi";

  }else{

    resetInvestmentForm();

  }


  openModal(
    "investmentModal"
  );

}


/* =========================================================
   FORM EVENTS
========================================================= */

$("openTradingForm")
  .addEventListener(
    "click",
    () => {

      openTradingEditor();

    }
  );


$("openInvestmentForm")
  .addEventListener(
    "click",
    () => {

      openInvestmentEditor();

    }
  );


$("tradingForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const form =
        event.currentTarget;

      const fd =
        new FormData(form);


      const id =
        String(
          fd.get("id") || ""
        );


      const pair =
        String(
          fd.get("pair") || ""
        ).trim();


      const side =
        String(
          fd.get("side") || "Buy"
        );


      const result =
        String(
          fd.get("result") || "profit"
        );


      const amount =
        number(
          fd.get("amount")
        );


      const date =
        String(
          fd.get("date") ||
          today()
        );


      if(!pair){

        alert(
          "Masukkan pair trading."
        );

        return;

      }


      if(amount <= 0){

        alert(
          "Nominal harus lebih dari 0."
        );

        return;

      }


      const pl =
        result === "loss"
          ? -amount
          : amount;


      if(id){

        const index =
          state.trading.findIndex(
            x => x.id === id
          );


        if(index !== -1){

          state.trading[index] = {

            ...state.trading[index],

            pair,

            side,

            pl,

            date

          };

        }

      }else{

        state.trading.unshift({

          id:uid(),

          pair,

          side,

          pl,

          date

        });

      }


      if(saveState()){

        closeModal(
          "tradingModal"
        );

        renderAll();

        setPage(
          "trading"
        );

      }

    }
  );


$("investmentForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const form =
        event.currentTarget;

      const fd =
        new FormData(form);


      const id =
        String(
          fd.get("id") || ""
        );


      const name =
        String(
          fd.get("name") || ""
        ).trim();


      const capital =
        number(
          fd.get("capital")
        );


      const returnPct =
        number(
          fd.get("returnPct")
        );


      const date =
        String(
          fd.get("date") ||
          today()
        );


      if(!name){

        alert(
          "Masukkan nama instrumen."
        );

        return;

      }


      if(capital <= 0){

        alert(
          "Modal instrumen harus lebih dari 0."
        );

        return;

      }


      if(!Number.isFinite(returnPct)){

        alert(
          "Masukkan persentase perubahan."
        );

        return;

      }


      /*
        Jika instrumen baru,
        cek apakah nama instrumen
        sudah ada.
      */

      const duplicate =
        state.investments.find(
          x =>
            x.name.trim().toUpperCase() ===
            name.toUpperCase() &&
            x.id !== id
        );


      if(duplicate){

        alert(
          "Instrumen tersebut sudah ada. " +
          "Gunakan tombol Edit untuk memperbaruinya."
        );

        return;

      }


      if(id){

        const index =
          state.investments.findIndex(
            x => x.id === id
          );


        if(index !== -1){

          state.investments[index] = {

            ...state.investments[index],

            name,

            capital,

            returnPct,

            date

          };

        }

      }else{

        state.investments.unshift({

          id:uid(),

          name,

          capital,

          returnPct,

          date

        });

      }


      if(saveState()){

        closeModal(
          "investmentModal"
        );

        renderAll();

        setPage(
          "investment"
        );

      }

    }
  );


/* =========================================================
   PROFILE SAVE
========================================================= */

$("saveProfileBtn")
  .addEventListener(
    "click",
    () => {

      const name =
        $("profileNameInput")
          .value
          .trim();


      const bio =
        $("profileBioInput")
          .value
          .trim();


      const tradingCapital =
        number(
          $("tradingCapitalInput").value
        );


      const investmentCapital =
        number(
          $("investmentCapitalInput").value
        );


      const exchangeRate =
        number(
          $("exchangeRateInput").value
        );


      if(exchangeRate <= 0){

        alert(
          "Kurs USD/IDR harus lebih dari 0."
        );

        return;

      }


      state.profile.name =
        name ||
        "Pengguna";


      state.profile.bio =
        bio ||
        "Trader & investor";


      state.settings.tradingCapitalUSD =
        Math.max(
          0,
          tradingCapital
        );


      state.settings.investmentCapitalIDR =
        Math.max(
          0,
          investmentCapital
        );


      state.settings.exchangeRate =
        exchangeRate;


      if(saveState()){

        renderAll();


        $("profileSaved").textContent =
          "Perubahan berhasil disimpan";


        setTimeout(
          () => {

            $("profileSaved").textContent =
              "";

          },
          1800
        );

      }

    }
  );


/* =========================================================
   PROFILE IMAGE
========================================================= */

$("profileAvatarBtn")
  .addEventListener(
    "click",
    () => {

      $("profileImageInput")
        .click();

    }
  );


$("profileImageInput")
  .addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      if(!file){

        return;

      }


      if(
        !file.type.startsWith(
          "image/"
        )
      ){

        alert(
          "File harus berupa gambar."
        );

        return;

      }


      try{

        const compressed =
          await compressImage(
            file
          );


        state.profile.avatar =
          compressed;


        if(saveState()){

          renderAll();

        }

      }catch(error){

        console.error(error);

        alert(
          "Foto gagal diproses."
        );

      }


      event.target.value =
        "";

    }
  );


/* =========================================================
   IMAGE COMPRESSION
========================================================= */

function compressImage(file){

  return new Promise(
    (resolve,reject) => {

      const reader =
        new FileReader();


      reader.onload =
        event => {

          const img =
            new Image();


          img.onload =
            () => {

              const max =
                900;


              let width =
                img.width;

              let height =
                img.height;


              if(
                width > max
              ){

                height =
                  height *
                  max /
                  width;

                width =
                  max;

              }


              if(
                height > max
              ){

                width =
                  width *
                  max /
                  height;

                height =
                  max;

              }


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                Math.round(width);

              canvas.height =
                Math.round(height);


              const ctx =
                canvas.getContext(
                  "2d"
                );


              ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
              );


              resolve(
                canvas.toDataURL(
                  "image/jpeg",
                  .76
                )
              );

            };


          img.onerror =
            reject;


          img.src =
            event.target.result;

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   MODAL
========================================================= */

function openModal(id){

  const modal =
    $(id);


  if(!modal){

    return;

  }


  modal.classList.add(
    "open"
  );


  document.body.style.overflow =
    "hidden";

}


function closeModal(id){

  const modal =
    $(id);


  if(!modal){

    return;

  }


  modal.classList.remove(
    "open"
  );


  if(
    !document.querySelector(
      ".modal.open"
    )
  ){

    document.body.style.overflow =
      "";

  }

}


/* =========================================================
   DELETE
========================================================= */

function askDelete(
  type,
  id
){

  pendingDelete = {
    type,
    id
  };


  openModal(
    "confirmModal"
  );

}


$("confirmDeleteBtn")
  .addEventListener(
    "click",
    () => {

      const {
        type,
        id
      } = pendingDelete;


      if(!type || !id){

        closeModal(
          "confirmModal"
        );

        return;

      }


      if(type === "trading"){

        state.trading =
          state.trading.filter(
            x => x.id !== id
          );

      }


      if(type === "investment"){

        state.investments =
          state.investments.filter(
            x => x.id !== id
          );

      }


      pendingDelete = {
        type:null,
        id:null
      };


      saveState();

      closeModal(
        "confirmModal"
      );

      renderAll();

    }
  );


/* =========================================================
   GLOBAL CLICK
========================================================= */

document.addEventListener(
  "click",
  event => {

    const nav =
      event.target.closest(
        ".nav-item"
      );


    if(nav){

      event.preventDefault();

      setPage(
        nav.dataset.page
      );

      return;

    }


    const go =
      event.target.closest(
        "[data-go]"
      );


    if(go){

      event.preventDefault();

      setPage(
        go.dataset.go
      );

      return;

    }


    const editTrading =
      event.target.closest(
        "[data-edit-trading]"
      );


    if(editTrading){

      openTradingEditor(
        editTrading.dataset.editTrading
      );

      return;

    }


    const deleteTrading =
      event.target.closest(
        "[data-delete-trading]"
      );


    if(deleteTrading){

      askDelete(
        "trading",
        deleteTrading.dataset.deleteTrading
      );

      return;

    }


    const editInvestment =
      event.target.closest(
        "[data-edit-investment]"
      );


    if(editInvestment){

      openInvestmentEditor(
        editInvestment.dataset.editInvestment
      );

      return;

    }


    const deleteInvestment =
      event.target.closest(
        "[data-delete-investment]"
      );


    if(deleteInvestment){

      askDelete(
        "investment",
        deleteInvestment.dataset.deleteInvestment
      );

      return;

    }


    const close =
      event.target.closest(
        "[data-close]"
      );


    if(close){

      closeModal(
        close.dataset.close
      );

    }

  }
);


/* =========================================================
   TOP PROFILE
========================================================= */

$("topAvatarBtn")
  .addEventListener(
    "click",
    () => {

      setPage(
        "profile"
      );

    }
  );


$("homeEditProfile")
  .addEventListener(
    "click",
    () => {

      setPage(
        "profile"
      );

    }
  );


/* =========================================================
   CALENDAR
========================================================= */

function allActivities(){

  const trading =
    state.trading.map(item => ({

      date:item.date,

      title:
        `Trading ${item.pair}`,

      value:
        number(item.pl) *
        state.settings.exchangeRate

    }));


  const investments =
    state.investments.map(item => {

      const pl =
        number(item.capital) *
        number(item.returnPct) /
        100;


      return {

        date:item.date,

        title:
          `Investasi ${item.name}`,

        value:pl

      };

    });


  return [
    ...trading,
    ...investments
  ];

}


function renderCalendar(
  containerId,
  type
){

  const container =
    $(containerId);


  if(!container){

    return;

  }


  const cursor =
    calendarCursor[type];


  const selected =
    calendarSelected[type];


  const year =
    cursor.getFullYear();


  const month =
    cursor.getMonth();


  const monthName =
    cursor.toLocaleDateString(
      "id-ID",
      {
        month:"long",
        year:"numeric"
      }
    );


  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();


  const offset =
    firstDay === 0
      ? 6
      : firstDay - 1;


  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const activityDates =
    new Set(
      allActivities()
        .map(x => x.date)
    );


  let html = `

    <div class="calendar-head">

      <div class="calendar-month">
        ${escapeHTML(
          monthName
        )}
      </div>

      <div class="calendar-nav">

        <button
          type="button"
          data-calendar-prev="${type}">
          ‹
        </button>

        <button
          type="button"
          data-calendar-next="${type}">
          ›
        </button>

      </div>

    </div>


    <div class="calendar-week">

      <span>Sen</span>
      <span>Sel</span>
      <span>Rab</span>
      <span>Kam</span>
      <span>Jum</span>
      <span>Sab</span>
      <span>Min</span>

    </div>


    <div class="calendar-days">
  `;


  for(
    let i = 0;
    i < offset;
    i++
  ){

    html += `
      <button
        type="button"
        class="calendar-day muted-day">
      </button>
    `;

  }


  for(
    let day = 1;
    day <= days;
    day++
  ){

    const date =
      `${year}-${String(
        month + 1
      ).padStart(2,"0")}-${String(
        day
      ).padStart(2,"0")}`;


    const isToday =
      date === today();


    const isSelected =
      date === selected;


    const hasActivity =
      activityDates.has(
        date
      );


    html += `

      <button
        type="button"
        class="
          calendar-day
          ${isToday ? "today" : ""}
          ${isSelected ? "selected" : ""}
          ${hasActivity ? "has-activity" : ""}
        "
        data-calendar-day="${type}"
        data-date="${date}">

        ${day}

      </button>

    `;

  }


  html += `
    </div>

    <div class="calendar-info">
  `;


  const selectedActivities =
    allActivities()
      .filter(
        x =>
          x.date === selected
      );


  if(
    selectedActivities.length
  ){

    html += `

      <strong>
        Aktivitas ${escapeHTML(
          formatDate(selected)
        )}
      </strong>

      ${
        selectedActivities
          .slice(0,4)
          .map(item => `

            <div>
              ${escapeHTML(
                item.title
              )}

              ·

              ${signedRupiah(
                item.value
              )}
            </div>

          `)
          .join("")
      }

    `;

  }else{

    html += `

      <strong>
        ${escapeHTML(
          formatDate(selected)
        )}
      </strong>

      Tidak ada aktivitas pada tanggal ini.

    `;

  }


  html += `
    </div>
  `;


  container.innerHTML =
    html;

}


document.addEventListener(
  "click",
  event => {

    const prev =
      event.target.closest(
        "[data-calendar-prev]"
      );


    if(prev){

      const type =
        prev.dataset.calendarPrev;


      calendarCursor[type]
        .setMonth(
          calendarCursor[type]
            .getMonth() - 1
        );


      renderCalendar(
        type === "home"
          ? "homeCalendar"
          : "profileCalendar",
        type
      );

      return;

    }


    const next =
      event.target.closest(
        "[data-calendar-next]"
      );


    if(next){

      const type =
        next.dataset.calendarNext;


      calendarCursor[type]
        .setMonth(
          calendarCursor[type]
            .getMonth() + 1
        );


      renderCalendar(
        type === "home"
          ? "homeCalendar"
          : "profileCalendar",
        type
      );

      return;

    }


    const day =
      event.target.closest(
        "[data-calendar-day]"
      );


    if(day){

      const type =
        day.dataset.calendarDay;


      calendarSelected[type] =
        day.dataset.date;


      renderCalendar(
        type === "home"
          ? "homeCalendar"
          : "profileCalendar",
        type
      );

    }

  }
);


/* =========================================================
   CHART DATA
========================================================= */

function buildOverallCurve(){

  const events = [

    ...state.trading.map(item => ({

      date:item.date,

      value:
        number(item.pl) *
        state.settings.exchangeRate

    })),

    ...state.investments.map(item => ({

      date:item.date,

      value:
        number(item.capital) *
        number(item.returnPct) /
        100

    }))

  ];


  events.sort(
    (a,b) =>
      a.date.localeCompare(
        b.date
      )
  );


  let total =
    totalInitialIDR();


  const curve =
    [Math.max(0,total)];


  events.forEach(event => {

    total +=
      event.value;

    curve.push(
      Math.max(0,total)
    );

  });


  return curve;

}


function buildTradingCurve(){

  let total =
    state.settings.tradingCapitalUSD;


  const curve =
    [Math.max(0,total)];


  state.trading
    .slice()
    .reverse()
    .forEach(item => {

      total +=
        number(item.pl);

      curve.push(
        Math.max(0,total)
      );

    });


  return curve;

}


function buildInvestmentCurve(){

  let total =
    investmentCapital();


  const curve =
    [Math.max(0,total)];


  state.investments
    .slice()
    .reverse()
    .forEach(item => {

      const pl =
        number(item.capital) *
        number(item.returnPct) /
        100;


      total += pl;

      curve.push(
        Math.max(0,total)
      );

    });


  return curve;

}


/* =========================================================
   LINE CHART
========================================================= */

function drawLineChart(
  canvas,
  data
){

  if(!canvas){

    return;

  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  const dpr =
    window.devicePixelRatio ||
    1;


  const width =
    canvas.clientWidth ||
    500;


  const height =
    210;


  canvas.width =
    width * dpr;


  canvas.height =
    height * dpr;


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const pad = {

    left:10,

    right:10,

    top:15,

    bottom:24

  };


  ctx.strokeStyle =
    "#252c38";


  ctx.lineWidth =
    1;


  for(
    let i = 0;
    i < 4;
    i++
  ){

    const y =
      pad.top +
      (
        height -
        pad.top -
        pad.bottom
      ) *
      i /
      3;


    ctx.beginPath();

    ctx.moveTo(
      pad.left,
      y
    );

    ctx.lineTo(
      width - pad.right,
      y
    );

    ctx.stroke();

  }


  if(data.length < 2){

    ctx.fillStyle =
      "#778092";

    ctx.font =
      "11px system-ui";

    ctx.textAlign =
      "left";

    ctx.fillText(
      "Belum cukup data untuk grafik",
      pad.left,
      height / 2
    );

    return;

  }


  const max =
    Math.max(...data);


  const min =
    Math.min(...data);


  const range =
    (max - min) || 1;


  const points =
    data.map(
      (value,index) => ({

        x:
          pad.left +
          (
            width -
            pad.left -
            pad.right
          ) *
          index /
          (data.length - 1),

        y:
          pad.top +
          (
            height -
            pad.top -
            pad.bottom
          ) *
          (
            1 -
            (
              value - min
            ) /
            range
          )

      })
    );


  const performance =
    overallPerformance();


  const t =
    tone(
      performance
    );


  const color =
    t === "positive"
      ? "#45d79b"
      : t === "negative"
        ? "#ff6175"
        : "#e8c65a";


  /* AREA */

  ctx.beginPath();


  points.forEach(
    (point,index) => {

      if(index === 0){

        ctx.moveTo(
          point.x,
          point.y
        );

      }else{

        ctx.lineTo(
          point.x,
          point.y
        );

      }

    }
  );


  const last =
    points[points.length - 1];


  const first =
    points[0];


  ctx.lineTo(
    last.x,
    height - pad.bottom
  );


  ctx.lineTo(
    first.x,
    height - pad.bottom
  );


  ctx.closePath();


  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      height
    );


  gradient.addColorStop(
    0,
    hexToRGBA(
      color,
      .18
    )
  );


  gradient.addColorStop(
    1,
    hexToRGBA(
      color,
      0
    )
  );


  ctx.fillStyle =
    gradient;


  ctx.fill();


  /* LINE */

  ctx.beginPath();


  points.forEach(
    (point,index) => {

      if(index === 0){

        ctx.moveTo(
          point.x,
          point.y
        );

      }else{

        ctx.lineTo(
          point.x,
          point.y
        );

      }

    }
  );


  ctx.strokeStyle =
    color;


  ctx.lineWidth =
    3;


  ctx.lineCap =
    "round";


  ctx.lineJoin =
    "round";


  ctx.stroke();


  /* LAST POINT */

  ctx.beginPath();


  ctx.arc(
    last.x,
    last.y,
    5,
    0,
    Math.PI * 2
  );


  ctx.fillStyle =
    color;


  ctx.fill();


  /* LABEL */

  ctx.fillStyle =
    "#aab2c0";


  ctx.font =
    "600 10px system-ui";


  ctx.textAlign =
    "right";


  ctx.fillText(
    formatCompactValue(
      data[data.length - 1]
    ),
    width - pad.right,
    Math.max(
      14,
      last.y - 10
    )
  );

}


/* =========================================================
   BAR CHART
========================================================= */

function drawBarChart(
  canvas,
  data,
  performance
){

  if(!canvas){

    return;

  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  const dpr =
    window.devicePixelRatio ||
    1;


  const width =
    canvas.clientWidth ||
    500;


  const height =
    210;


  canvas.width =
    width * dpr;


  canvas.height =
    height * dpr;


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const max =
    Math.max(
      ...data,
      1
    );


  const base =
    height - 38;


  const barWidth =
    Math.min(
      65,
      width / 3 * .5
    );


  const overallTone =
    tone(
      performance
    );


  const netColor =
    overallTone === "positive"
      ? "#45d79b"
      : overallTone === "negative"
        ? "#ff6175"
        : "#e8c65a";


  const colors = [
    "#45d79b",
    "#ff6175",
    netColor
  ];


  const labels = [
    "Profit",
    "Loss",
    "Net"
  ];


  data.forEach(
    (value,index) => {

      const x =
        width *
        (index + .5) /
        3 -
        barWidth / 2;


      const barHeight =
        (
          Math.max(
            0,
            value
          ) /
          max
        ) *
        (
          height - 75
        );


      ctx.fillStyle =
        colors[index];


      ctx.fillRect(
        x,
        base - barHeight,
        barWidth,
        barHeight
      );


      ctx.fillStyle =
        "#8993a2";


      ctx.font =
        "10px system-ui";


      ctx.textAlign =
        "center";


      ctx.fillText(
        labels[index],
        x + barWidth / 2,
        height - 17
      );


      ctx.fillStyle =
        "#dfe4ea";


      ctx.fillText(
        formatCompactValue(
          value
        ),
        x + barWidth / 2,
        Math.max(
          14,
          base -
          barHeight -
          8
        )
      );

    }
  );

}


/* =========================================================
   CHART HELPERS
========================================================= */

function formatCompactValue(
  value
){

  const n =
    number(value);


  const abs =
    Math.abs(n);


  if(abs >= 1000000000){

    return (
      "Rp " +
      (
        n /
        1000000000
      ).toFixed(1) +
      "M"
    );

  }


  if(abs >= 1000000){

    return (
      "Rp " +
      (
        n /
        1000000
      ).toFixed(1) +
      "jt"
    );

  }


  if(abs >= 1000){

    return (
      "Rp " +
      (
        n /
        1000
      ).toFixed(1) +
      "rb"
    );

  }


  return rupiah(n);

}


function hexToRGBA(
  hex,
  alpha
){

  const clean =
    hex.replace(
      "#",
      ""
    );


  const bigint =
    parseInt(
      clean,
      16
    );


  const r =
    (bigint >> 16) & 255;


  const g =
    (bigint >> 8) & 255;


  const b =
    bigint & 255;


  return `
    rgba(
      ${r},
      ${g},
      ${b},
      ${alpha}
    )
  `;

}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
  "resize",
  () => {

    const active =
      document.querySelector(
        ".page.active"
      );


    if(!active){

      return;

    }


    renderPage(
      active.id.replace(
        "page-",
        ""
      )
    );

  }
);


/* =========================================================
   ESCAPE MODAL
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if(
      event.key !==
      "Escape"
    ){

      return;

    }


    document
      .querySelectorAll(
        ".modal.open"
      )
      .forEach(
        modal => {

          closeModal(
            modal.id
          );

        }
      );

  }
);


/* =========================================================
   START
========================================================= */

renderAll();