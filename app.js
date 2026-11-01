const LIFF_ID = "2012319316-QifbEVdi";
const params = new URLSearchParams(location.search);
// liff.state carries the query when opened through liff.line.me
const state = params.get("liff.state");
const inner = state ? new URLSearchParams(state.split("?")[1] || "") : params;
const cardName = (inner.get("card") || params.get("card") || "tutorial").replace(/[^a-z0-9_-]/gi, "");
const $ = (id) => document.getElementById(id);
const say = (t) => { $("status").textContent = t; };

let messages = null;

// Second button: send straight into the chat this LIFF was opened from
// (liff.sendMessages; needs the chat_message.write scope).
const here = document.createElement("button");
here.id = "here";
here.textContent = "送到目前聊天室";
here.disabled = true;
$("share").after(here);

async function main() {
  try {
    const res = await fetch(`cards/${cardName}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`找不到圖卡 ${cardName}`);
    const card = await res.json();
    messages = card.messages;
    $("title").textContent = card.title || "圖卡分享";
    $("desc").textContent = `共 ${messages.length} 則訊息。（v8）`;

    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    const ctx = liff.getContext() || {};
    const lines = [`聊天室類型：${ctx.type || "未知"}`];
    if (liff.isApiAvailable("shareTargetPicker")) $("share").disabled = false;
    else lines.push("分享視窗不能用");
    if (["utou", "group", "room", "square_chat"].includes(ctx.type)) here.disabled = false;
    else lines.push("要從聊天室裡點開這個連結，才能用「送到目前聊天室」");
    say(lines.join("\n"));
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

here.addEventListener("click", async () => {
  here.disabled = true;
  try {
    const p = await liff.permission.query("chat_message.write");
    say("傳送權限：" + p.state);
    if (p.state !== "granted") { await liff.permission.requestAll(); return; }
    await liff.sendMessages(messages);
    say("已送到目前聊天室。");
    setTimeout(() => liff.closeWindow(), 800);
  } catch (e) {
    say("送出失敗：" + (e.code ? e.code + " " : "") + (e.message || e));
    here.disabled = false;
    // Token was issued before chat_message.write was added: log in again once.
    if (e.code === "FORBIDDEN" && !sessionStorage.getItem("relogin")) {
      sessionStorage.setItem("relogin", "1");
      liff.logout();
      liff.login({ redirectUri: location.href });
    }
  }
});

main();
