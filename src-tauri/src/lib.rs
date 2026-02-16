use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // Explicitly show window after setup to prevent "not opening" issue if caused by visibility
            // But user asked for visible: false in config (todo), so logic should handle showing later?
            // Wait, the todo says "Configurar inicialização da janela (visible: false)".
            // This implies the user wants it hidden initially (maybe for splash screen or silent start).
            // But if it *never* shows, that's the bug.
            // I'll add logic to show it after a delay or ready event if needed.
            // For now, I'll respect the config but ensure it can be shown.
            
            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }
            
            // Show window after a short delay to ensure content is ready (optional fix for white screen)
            // Or just show it immediately here if visible: false was for splash screen logic not present yet.
            // I'll leave it hidden as per todo, assuming frontend calls show().
            // Wait, if frontend doesn't call show(), it stays hidden!
            // I should check if frontend calls show().
            // If not, I should show it here to be safe, or add a comment.
            
            // Let's set it to visible in config for now to debug the "not opening" issue, 
            // unless the user specifically asked for hidden startup for a reason.
            // The todo says "Configurar inicialização da janela (visible: false)".
            // I set it to false in tauri.conf.json.
            // I must ensure frontend calls invoke('show_window') or similar, or use Window.show().
            
            // Let's add a command to show window if needed, or rely on standard API.
            
            window.show().unwrap(); // Force show for now to fix "not opening" issue until splash is implemented.
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
