// Kart Atölyesi — Windows başlatıcısı
// Uygulamayı Microsoft Edge (yoksa Google Chrome) "uygulama penceresi" modunda,
// adres çubuğu ve sekmeler olmadan, kendi ayrı profiliyle açar.
// Derleme: derle.cmd
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Kart Atölyesi")]
[assembly: AssemblyProduct("Kart Atölyesi")]
[assembly: AssemblyDescription("Deste tasarla, kart tara, kart çek")]
[assembly: AssemblyVersion("3.0.0.0")]
[assembly: AssemblyFileVersion("3.0.0.0")]

static class Baslatici
{
    [STAThread]
    static void Main()
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string html = Path.Combine(root, "kart", "index.html");
        if (!File.Exists(html))
        {
            MessageBox.Show("kart\\index.html bulunamadı.\nZIP dosyasının tamamını aynı klasöre çıkarıp tekrar dene.",
                "Kart Atölyesi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        string url = new Uri(html).AbsoluteUri;
        string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KartAtolyesi", "Profil");
        try { Directory.CreateDirectory(profile); } catch { }

        string browser = FindBrowser();
        if (browser == null)
        {
            Process.Start(new ProcessStartInfo(html) { UseShellExecute = true });
            return;
        }
        string args = "--app=\"" + url + "\" --user-data-dir=\"" + profile + "\" --window-size=1400,920 " +
                      "--no-first-run --no-default-browser-check --disable-features=msEdgeSidebarV2,msHubApps";
        Process.Start(new ProcessStartInfo(browser, args) { UseShellExecute = false });
    }

    static string FindBrowser()
    {
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string pf = Environment.GetEnvironmentVariable("ProgramW6432") ?? Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] candidates = {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf,   @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(local,@"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf,   @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(local,@"Google\Chrome\Application\chrome.exe")
        };
        foreach (var c in candidates) if (File.Exists(c)) return c;
        return null;
    }
}
