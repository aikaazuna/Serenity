param(
    [string]$Action = "list",
    [string]$ProcessName = "",
    [float]$Volume = 1.0,
    [bool]$Mute = $false
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "SilentlyContinue"

$csharp = @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Diagnostics;

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface ISimpleAudioVolume {
    [PreserveSig] int SetMasterVolume(float fLevel, ref Guid EventContext);
    [PreserveSig] int GetMasterVolume(out float pfLevel);
    [PreserveSig] int SetMute(bool bMute, ref Guid EventContext);
    [PreserveSig] int GetMute(out bool pbMute);
}

[Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioMeterInformation {
    [PreserveSig] int GetPeakValue(out float pfPeak);
    [PreserveSig] int GetMeteringChannelCount(out uint pnChannelCount);
    [PreserveSig] int GetChannelsPeakValues(uint u32ChannelCount, [Out] float[] afPeakValues);
    [PreserveSig] int QueryHardwareSupport(out uint pdwHardwareSupportMask);
}

[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionControl2 {
    [PreserveSig] int GetState(out int pRetVal);
    [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, ref Guid EventContext);
    [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, ref Guid EventContext);
    [PreserveSig] int GetGroupingParam(out Guid pRetVal);
    [PreserveSig] int SetGroupingParam(ref Guid Override, ref Guid EventContext);
    [PreserveSig] int RegisterAudioSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int UnregisterAudioSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetProcessId(out uint pRetVal);
    [PreserveSig] int IsSystemSoundsSession();
    [PreserveSig] int SetDuckingPreference(bool optOut);
}

[Guid("E2F5E976-9861-4511-826C-73E699A16306"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionEnumerator {
    [PreserveSig] int GetCount(out int SessionCount);
    [PreserveSig] int GetSession(int SessionIndex, out IntPtr Session);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionManager2 {
    [PreserveSig] int GetAudioSessionControl(ref Guid AudioSessionGuid, uint StreamFlags, out IntPtr SessionControl);
    [PreserveSig] int GetSimpleAudioVolume(ref Guid AudioSessionGuid, uint StreamFlags, out IntPtr AudioVolume);
    [PreserveSig] int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
    [PreserveSig] int RegisterSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int UnregisterSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int RegisterDuckNotification([MarshalAs(UnmanagedType.LPWStr)] string sessionID, IntPtr NewNotifications);
    [PreserveSig] int UnregisterDuckNotification(IntPtr NewNotifications);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
    [PreserveSig] int Activate(ref Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
}

[Guid("0BD7A1BE-7A1A-44DB-A416-83EC143008B0"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceCollection {
    [PreserveSig] int GetCount(out uint pcDevices);
    [PreserveSig] int Item(uint nDevice, out IMMDevice ppDevice);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
    [PreserveSig] int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IMMDeviceCollection ppDevices);
    [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
    [PreserveSig] int RegisterControlChangeNotify(IntPtr pNotify);
    [PreserveSig] int UnregisterControlChangeNotify(IntPtr pNotify);
    [PreserveSig] int GetChannelCount(out uint pnChannelCount);
    [PreserveSig] int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
    [PreserveSig] int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
    [PreserveSig] int GetMasterVolumeLevel(out float pfLevelDB);
    [PreserveSig] int GetMasterVolumeLevelScalar(out float pfLevel);
    [PreserveSig] int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
    [PreserveSig] int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
    [PreserveSig] int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
    [PreserveSig] int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
    [PreserveSig] int SetMute(bool bMute, ref Guid pguidEventContext);
    [PreserveSig] int GetMute(out bool pbMute);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumeratorComObject { }

public class CoreAudioMixer {
    public static string GetSessions() {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDeviceCollection collection;
            enumerator.EnumAudioEndpoints(0, 1, out collection);
            if (collection == null) return "[]";

            uint devCount = 0;
            collection.GetCount(out devCount);

            var list = new List<string>();
            var seenPids = new HashSet<uint>();

            for (uint d = 0; d < devCount; d++) {
                IMMDevice dev;
                collection.Item(d, out dev);
                if (dev == null) continue;

                var iid = typeof(IAudioSessionManager2).GUID;
                object o;
                dev.Activate(ref iid, 23, IntPtr.Zero, out o);
                var mgr = (IAudioSessionManager2)o;
                if (mgr == null) continue;

                IAudioSessionEnumerator sessionEnum;
                mgr.GetSessionEnumerator(out sessionEnum);
                if (sessionEnum == null) continue;

                int count;
                sessionEnum.GetCount(out count);

                for (int i = 0; i < count; i++) {
                    IntPtr sessionPtr;
                    sessionEnum.GetSession(i, out sessionPtr);
                    if (sessionPtr == IntPtr.Zero) continue;

                    var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sessionPtr);
                    var vol = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(sessionPtr);

                    uint pid;
                    ctl.GetProcessId(out pid);

                    if (seenPids.Contains(pid) || pid == 0) continue;
                    seenPids.Add(pid);

                    float level = 1.0f;
                    vol.GetMasterVolume(out level);

                    bool isMuted = false;
                    vol.GetMute(out isMuted);

                    string procName = "System";
                    try {
                        var proc = Process.GetProcessById((int)pid);
                        procName = proc.ProcessName;
                    } catch {}

                    list.Add(string.Format("{{\"pid\":{0},\"processName\":\"{1}\",\"volume\":{2},\"isMuted\":{3}}}",
                        pid, procName.Replace("\\", "\\\\").Replace("\"", "\\\""), (int)Math.Round(level * 100), isMuted ? "true" : "false"));
                }
            }

            string[] knownApps = new string[] {
                "discord", "spotify", "chrome", "msedge", "firefox", "brave", "opera", "steamwebhelper",
                "obs64", "vlc", "foobar2000", "cs2", "valorant", "league of legends", "overwatch",
                "gta5", "r5apex", "fortniteclient-win64-shipping", "rocketleague", "minecraft"
            };
            foreach (var proc in Process.GetProcesses()) {
                try {
                    uint pid = (uint)proc.Id;
                    if (seenPids.Contains(pid) || pid == 0) continue;
                    string name = proc.ProcessName.ToLower();
                    bool match = false;
                    foreach (var k in knownApps) {
                        if (name.Contains(k)) { match = true; break; }
                    }
                    if (!match && !string.IsNullOrEmpty(proc.MainWindowTitle)) {
                        match = true;
                    }
                    if (match) {
                        seenPids.Add(pid);
                        list.Add(string.Format("{{\"pid\":{0},\"processName\":\"{1}\",\"volume\":100,\"isMuted\":false}}",
                            pid, proc.ProcessName.Replace("\\", "\\\\").Replace("\"", "\\\"")));
                    }
                } catch {}
            }

            return "[" + string.Join(",", list.ToArray()) + "]";
        } catch {
            return "[]";
        }
    }

    public static string GetPeakLevels() {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice dev;
            enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            float masterPeak = 0f;

            if (dev != null) {
                var meterId = typeof(IAudioMeterInformation).GUID;
                object meterObj;
                dev.Activate(ref meterId, 23, IntPtr.Zero, out meterObj);
                var masterMeter = (IAudioMeterInformation)meterObj;
                if (masterMeter != null) {
                    masterMeter.GetPeakValue(out masterPeak);
                }
            }

            var map = new List<string>();
            map.Add(string.Format("\"master\":{0:F2}", masterPeak));

            IMMDeviceCollection collection;
            enumerator.EnumAudioEndpoints(0, 1, out collection);
            if (collection != null) {
                uint devCount = 0;
                collection.GetCount(out devCount);
                var seenPids = new HashSet<uint>();

                for (uint d = 0; d < devCount; d++) {
                    IMMDevice ddev;
                    collection.Item(d, out ddev);
                    if (ddev == null) continue;

                    var iid = typeof(IAudioSessionManager2).GUID;
                    object o;
                    ddev.Activate(ref iid, 23, IntPtr.Zero, out o);
                    var mgr = (IAudioSessionManager2)o;
                    if (mgr == null) continue;

                    IAudioSessionEnumerator sessionEnum;
                    mgr.GetSessionEnumerator(out sessionEnum);
                    if (sessionEnum == null) continue;

                    int count;
                    sessionEnum.GetCount(out count);

                    for (int i = 0; i < count; i++) {
                        IntPtr sessionPtr;
                        sessionEnum.GetSession(i, out sessionPtr);
                        if (sessionPtr == IntPtr.Zero) continue;

                        var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sessionPtr);
                        var meter = (IAudioMeterInformation)Marshal.GetObjectForIUnknown(sessionPtr);

                        uint pid;
                        ctl.GetProcessId(out pid);
                        if (seenPids.Contains(pid) || pid == 0) continue;
                        seenPids.Add(pid);

                        float peak = 0f;
                        if (meter != null) {
                            meter.GetPeakValue(out peak);
                        }

                        try {
                            var proc = Process.GetProcessById((int)pid);
                            map.Add(string.Format("\"{0}\":{1:F2}", proc.ProcessName.ToLower(), peak));
                        } catch {}
                    }
                }
            }

            return "{" + string.Join(",", map.ToArray()) + "}";
        } catch {
            return "{\"master\":0.0}";
        }
    }

    public static bool SetProcessVolume(string processName, float level) {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDeviceCollection collection;
            enumerator.EnumAudioEndpoints(0, 1, out collection);
            if (collection == null) return false;

            uint devCount = 0;
            collection.GetCount(out devCount);
            Guid emptyGuid = Guid.Empty;

            for (uint d = 0; d < devCount; d++) {
                IMMDevice dev;
                collection.Item(d, out dev);
                if (dev == null) continue;

                var iid = typeof(IAudioSessionManager2).GUID;
                object o;
                dev.Activate(ref iid, 23, IntPtr.Zero, out o);
                var mgr = (IAudioSessionManager2)o;
                if (mgr == null) continue;

                IAudioSessionEnumerator sessionEnum;
                mgr.GetSessionEnumerator(out sessionEnum);
                if (sessionEnum == null) continue;

                int count;
                sessionEnum.GetCount(out count);

                for (int i = 0; i < count; i++) {
                    IntPtr sessionPtr;
                    sessionEnum.GetSession(i, out sessionPtr);
                    if (sessionPtr == IntPtr.Zero) continue;

                    var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sessionPtr);
                    var vol = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(sessionPtr);

                    uint pid;
                    ctl.GetProcessId(out pid);

                    if (pid > 0) {
                        try {
                            var proc = Process.GetProcessById((int)pid);
                            if (proc.ProcessName.IndexOf(processName, StringComparison.OrdinalIgnoreCase) >= 0 ||
                                processName.IndexOf(proc.ProcessName, StringComparison.OrdinalIgnoreCase) >= 0) {
                                vol.SetMasterVolume(level, ref emptyGuid);
                            }
                        } catch {}
                    }
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    public static bool SetProcessMute(string processName, bool isMuted) {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDeviceCollection collection;
            enumerator.EnumAudioEndpoints(0, 1, out collection);
            if (collection == null) return false;

            uint devCount = 0;
            collection.GetCount(out devCount);
            Guid emptyGuid = Guid.Empty;

            for (uint d = 0; d < devCount; d++) {
                IMMDevice dev;
                collection.Item(d, out dev);
                if (dev == null) continue;

                var iid = typeof(IAudioSessionManager2).GUID;
                object o;
                dev.Activate(ref iid, 23, IntPtr.Zero, out o);
                var mgr = (IAudioSessionManager2)o;
                if (mgr == null) continue;

                IAudioSessionEnumerator sessionEnum;
                mgr.GetSessionEnumerator(out sessionEnum);
                if (sessionEnum == null) continue;

                int count;
                sessionEnum.GetCount(out count);

                for (int i = 0; i < count; i++) {
                    IntPtr sessionPtr;
                    sessionEnum.GetSession(i, out sessionPtr);
                    if (sessionPtr == IntPtr.Zero) continue;

                    var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sessionPtr);
                    var vol = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(sessionPtr);

                    uint pid;
                    ctl.GetProcessId(out pid);

                    if (pid > 0) {
                        try {
                            var proc = Process.GetProcessById((int)pid);
                            if (proc.ProcessName.IndexOf(processName, StringComparison.OrdinalIgnoreCase) >= 0 ||
                                processName.IndexOf(proc.ProcessName, StringComparison.OrdinalIgnoreCase) >= 0) {
                                vol.SetMute(isMuted, ref emptyGuid);
                            }
                        } catch {}
                    }
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    public static bool SetMasterVolume(float level) {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice dev;
            enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (dev == null) return false;

            var iid = typeof(IAudioEndpointVolume).GUID;
            object o;
            dev.Activate(ref iid, 23, IntPtr.Zero, out o);
            var masterVol = (IAudioEndpointVolume)o;
            if (masterVol == null) return false;

            Guid emptyGuid = Guid.Empty;
            masterVol.SetMasterVolumeLevelScalar(level, ref emptyGuid);
            return true;
        } catch {
            return false;
        }
    }

    public static bool SetMasterMute(bool isMuted) {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice dev;
            enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (dev == null) return false;

            var iid = typeof(IAudioEndpointVolume).GUID;
            object o;
            dev.Activate(ref iid, 23, IntPtr.Zero, out o);
            var masterVol = (IAudioEndpointVolume)o;
            if (masterVol == null) return false;

            Guid emptyGuid = Guid.Empty;
            masterVol.SetMute(isMuted, ref emptyGuid);
            return true;
        } catch {
            return false;
        }
    }
}
"@

Add-Type -TypeDefinition $csharp -Language CSharp -ErrorAction SilentlyContinue

if ($Action -eq "server") {
    while ($true) {
        $line = [Console]::In.ReadLine()
        if ($null -eq $line -or $line -eq "exit") { break }
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try {
            $cmd = ConvertFrom-Json $line
            if ($cmd.action -eq "list") {
                $out = [CoreAudioMixer]::GetSessions()
                [Console]::WriteLine($out)
            } elseif ($cmd.action -eq "peaks") {
                $out = [CoreAudioMixer]::GetPeakLevels()
                [Console]::WriteLine($out)
            } elseif ($cmd.action -eq "set-process-volume") {
                $res = [CoreAudioMixer]::SetProcessVolume($cmd.processName, [float]$cmd.volume)
                [Console]::WriteLine($res)
            } elseif ($cmd.action -eq "set-process-mute") {
                $res = [CoreAudioMixer]::SetProcessMute($cmd.processName, [bool]$cmd.isMuted)
                [Console]::WriteLine($res)
            } elseif ($cmd.action -eq "set-master-volume") {
                $res = [CoreAudioMixer]::SetMasterVolume([float]$cmd.volume)
                [Console]::WriteLine($res)
            } elseif ($cmd.action -eq "set-master-mute") {
                $res = [CoreAudioMixer]::SetMasterMute([bool]$cmd.isMuted)
                [Console]::WriteLine($res)
            } else {
                [Console]::WriteLine("{}")
            }
        } catch {
            [Console]::WriteLine("error")
        }
    }
} elseif ($Action -eq "list") {
    $out = [CoreAudioMixer]::GetSessions()
    [Console]::WriteLine($out)
} elseif ($Action -eq "peaks") {
    $out = [CoreAudioMixer]::GetPeakLevels()
    [Console]::WriteLine($out)
} elseif ($Action -eq "set-process-volume") {
    $res = [CoreAudioMixer]::SetProcessVolume($ProcessName, $Volume)
    [Console]::WriteLine($res)
} elseif ($Action -eq "set-process-mute") {
    $res = [CoreAudioMixer]::SetProcessMute($ProcessName, $Mute)
} elseif ($Action -eq "set-master-volume") {
    $res = [CoreAudioMixer]::SetMasterVolume($Volume)
    [Console]::WriteLine($res)
} elseif ($Action -eq "set-master-mute") {
    $res = [CoreAudioMixer]::SetMasterMute($Mute)
    [Console]::WriteLine($res)
}
