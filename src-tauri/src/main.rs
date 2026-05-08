#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::Manager;

const NATIVE_RECOVERY_SCRIPT: &str = r#"
(() => {
  try {
    const now = Date.now();
    const key = "native_resume_reload_at";
    const cooldownMs = 5 * 60 * 1000;
    const last = Number(localStorage.getItem(key) || "0");
    if (now - last < cooldownMs) return;
    localStorage.setItem(key, String(now));
    window.location.reload();
  } catch (_err) {
    window.location.reload();
  }
})();
"#;

fn startup_log_path() -> Option<PathBuf> {
    let local_app_data = std::env::var_os("LOCALAPPDATA")?;
    let mut dir = PathBuf::from(local_app_data);
    dir.push("Sezondakirala Admin");
    dir.push("logs");
    if fs::create_dir_all(&dir).is_err() {
        return None;
    }
    dir.push("startup-errors.log");
    Some(dir)
}

fn append_startup_log(message: &str) {
    if let Some(path) = startup_log_path() {
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
            let _ = writeln!(file, "{message}");
        }
    }
}

fn main() {
    std::panic::set_hook(Box::new(|panic_info| {
        append_startup_log(&format!(
            "[PANIC] {} | info: {}",
            chrono_like_now(),
            panic_info
        ));
    }));

    let run_result = tauri::Builder::default()
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(true) = event {
                if let Some(webview_window) = window.app_handle().get_webview_window(window.label()) {
                    if let Err(err) = webview_window.eval(NATIVE_RECOVERY_SCRIPT) {
                        append_startup_log(&format!(
                            "[RECOVERY_FOCUS_ERR] {} | error: {}",
                            chrono_like_now(),
                            err
                        ));
                    }
                }
            }
        })
        .run(tauri::generate_context!());
    if let Err(err) = run_result {
        append_startup_log(&format!("[RUN_ERR] {} | error: {}", chrono_like_now(), err));
        eprintln!("Uygulama baslatma hatasi: {err}");
        std::process::exit(1);
    }
}

fn chrono_like_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_secs().to_string(),
        Err(_) => "0".to_string(),
    }
}
