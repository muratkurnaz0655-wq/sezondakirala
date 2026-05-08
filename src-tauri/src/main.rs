#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

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

    let run_result = tauri::Builder::default().run(tauri::generate_context!());
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
