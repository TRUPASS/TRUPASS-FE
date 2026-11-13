// 흐름 검사가 Google Identity Services(https://accounts.google.com/gsi/client) 대신 내려 주는 스크립트.
// 진짜와 같은 함수(initialize · renderButton · disableAutoSelect)를 두고, 그린 단추를 누르면
// window.__googleAccount 로 정한 계정의 가짜 ID 토큰('fake:<이름>')을 initialize 때 받은 callback 에 넘긴다.
// 부른 기록은 window.__gsi 에 남긴다.
export const FAKE_GSI = `(() => {
  const log = (window.__gsi = { initialize: [], renderButton: [], disableAutoSelect: 0 });
  let callback = null;
  window.google = {
    accounts: {
      id: {
        initialize(config) {
          log.initialize.push({ client_id: config.client_id, ux_mode: config.ux_mode, auto_select: config.auto_select });
          callback = config.callback;
        },
        renderButton(parent, options) {
          log.renderButton.push(options);
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'fake-gsi';
          b.textContent = 'Google 계정으로 계속하기';
          b.style.cssText = 'width:' + (options.width || 300) + 'px;height:40px;border:1px solid #dadce0;border-radius:20px;background:#fff';
          b.onclick = () => callback && callback({ credential: 'fake:' + (window.__googleAccount || 'traveler'), select_by: 'btn' });
          parent.replaceChildren(b);
        },
        prompt() {},
        cancel() {},
        disableAutoSelect() {
          log.disableAutoSelect += 1;
        },
      },
    },
  };
})();`;
