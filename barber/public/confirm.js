(function() {
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'custom-confirm-dialog';

    var icon = document.createElement('div');
    icon.className = 'custom-confirm-icon';
    icon.innerHTML = '<i class="fas fa-question-circle"></i>';

    var message = document.createElement('div');
    message.className = 'custom-confirm-message';

    var sub = document.createElement('div');
    sub.className = 'custom-confirm-sub';
    sub.textContent = '此操作不可撤销，请谨慎确认';

    var actions = document.createElement('div');
    actions.className = 'custom-confirm-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'custom-confirm-btn custom-confirm-btn-cancel';
    cancelBtn.textContent = '取消';

    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'custom-confirm-btn custom-confirm-btn-confirm';
    confirmBtn.textContent = '确定';

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);

    dialog.appendChild(icon);
    dialog.appendChild(message);
    dialog.appendChild(sub);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    return {
      overlay: overlay,
      dialog: dialog,
      icon: icon,
      message: message,
      sub: sub,
      confirmBtn: confirmBtn,
      cancelBtn: cancelBtn
    };
  }

  window.customConfirm = function(el, msg, type) {
    var parts = createOverlay();
    parts.message.textContent = msg;

    if (type === 'danger') {
      parts.icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      parts.icon.style.background = 'linear-gradient(135deg, rgba(184, 106, 106, 0.12), rgba(184, 106, 106, 0.06))';
      parts.icon.style.color = '#B86A6A';
      parts.confirmBtn.className = 'custom-confirm-btn custom-confirm-btn-danger';
      parts.sub.textContent = '此操作执行后将无法恢复';
    } else if (type === 'warning') {
      parts.icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
      parts.icon.style.background = 'linear-gradient(135deg, rgba(216, 168, 72, 0.12), rgba(216, 168, 72, 0.06))';
      parts.icon.style.color = '#D8A848';
      parts.sub.textContent = '请确认是否继续操作';
    } else if (type === 'logout') {
      parts.icon.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
      parts.sub.textContent = '退出后需要重新登录';
    }

    requestAnimationFrame(function() {
      parts.overlay.classList.add('active');
    });

    return new Promise(function(resolve) {
      parts.confirmBtn.addEventListener('click', function() {
        parts.overlay.classList.remove('active');
        setTimeout(function() {
          parts.overlay.remove();
        }, 300);
        if (el && el.tagName === 'A' && el.href) {
          window.location.href = el.href;
        }
        resolve(true);
      });

      parts.cancelBtn.addEventListener('click', function() {
        parts.overlay.classList.remove('active');
        setTimeout(function() {
          parts.overlay.remove();
        }, 300);
        resolve(false);
      });

      parts.overlay.addEventListener('click', function(e) {
        if (e.target === parts.overlay) {
          parts.overlay.classList.remove('active');
          setTimeout(function() {
            parts.overlay.remove();
          }, 300);
          resolve(false);
        }
      });

      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
          parts.overlay.classList.remove('active');
          setTimeout(function() {
            parts.overlay.remove();
          }, 300);
          document.removeEventListener('keydown', handler);
          resolve(false);
        }
      });

      parts.confirmBtn.focus();
    });
  };

  window.confirmAction = function(el, msg, type) {
    customConfirm(el, msg, type);
    return false;
  };
})();
