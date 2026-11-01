const LIFF_ID = "2012319316-QifbEVdi";
const params = new URLSearchParams(location.search);
// liff.state carries the query when opened through liff.line.me
const state = params.get("liff.state");
const inner = state ? new URLSearchParams(state.split("?")[1] || "") : params;
const cardName = (inner.get("card") || params.get("card") || "tutorial").replace(/[^a-z0-9_-]/gi, "");
const $ = (id) => document.getElementById(id);
const say = (t) => { $("status").textContent = t; };

let messages = null;

async function main() {
  try {
    const res = await fetch(`cards/${cardName}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`找不到圖卡 ${cardName}`);
    const card = await res.json();
    messages = card.messages;
    $("title").textContent = card.title || "圖卡分享";
    $("desc").textContent = `共 ${messages.length} 則訊息。按下按鈕，選要傳送的聊天室。（v5）`;

    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    if (!liff.isApiAvailable("shareTargetPicker")) {
      say("這個環境不能用分享功能，請在 LINE 裡打開這個連結。");
      return;
    }
    $("share").disabled = false;
  } catch (e) {
    say("錯誤：" + (e.message || e));
  }
}

$("share").addEventListener("click", async () => {
  $("share").disabled = true;
  try {
    const r = await liff.shareTargetPicker(messages, { isMultiple: true });
    if (r) {
      say("已傳送。");
      setTimeout(() => liff.closeWindow(), 800);
    } else {
      say("已取消。");
      $("share").disabled = false;
    }
  } catch (e) {
    say("傳送失敗：" + (e.message || e));
    $("share").disabled = false;
  }
});

main();
