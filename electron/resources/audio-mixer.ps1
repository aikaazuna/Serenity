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
using System.Globalization;

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface ISimpleAudioVolume {
    [PreserveSig] int SetMasterVolume(float fLevel, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetMasterVolume(out float pfLevel);
    [PreserveSig] int SetMute(bool bMute, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetMute(out bool pbMute);
}

[Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioMeterInformation {
    [PreserveSig] int GetPeakValue(out float pfPeak);
}

[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionControl2 {
    [PreserveSig] int GetState(out int pRetVal);
    [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetGroupingParam(out Guid pRetVal);
    [PreserveSig] int SetGroupingParam([MarshalAs(UnmanagedType.LPStruct)] Guid Override, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int RegisterAudioSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int UnregisterAudioSessionNotification(IntPtr NewNotifications);
    [PreserveSig] int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetProcessId(out uint pRetVal);
    [PreserveSig] int IsSystemSoundsSession();
    [PreserveSig] int SetDuckingPreference(bool optOut);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionManager2 {
    [PreserveSig] int GetAudioSessionControl(IntPtr AudioSessionGuid, uint StreamFlags, out IntPtr SessionControl);
    [PreserveSig] int GetSimpleAudioVolume(IntPtr AudioSessionGuid, uint StreamFlags, out IntPtr AudioVolume);
    [PreserveSig] int GetSessionEnumerator(out IntPtr SessionEnum);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
    [PreserveSig] int Activate([MarshalAs(UnmanagedType.LPStruct)] Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
    [PreserveSig] int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IntPtr ppDevices);
    [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
    [PreserveSig] int RegisterControlChangeNotify(IntPtr pNotify);
    [PreserveSig] int UnregisterControlChangeNotify(IntPtr pNotify);
    [PreserveSig] int GetChannelCount(out uint pnChannelCount);
    [PreserveSig] int SetMasterVolumeLevel(float fLevelDB, [MarshalAs(UnmanagedType.LPStruct)] Guid pguidEventContext);
    [PreserveSig] int SetMasterVolumeLevelScalar(float fLevel, [MarshalAs(UnmanagedType.LPStruct)] Guid pguidEventContext);
    [PreserveSig] int GetMasterVolumeLevel(out float pfLevelDB);
    [PreserveSig] int GetMasterVolumeLevelScalar(out float pfLevel);
    [PreserveSig] int SetChannelVolumeLevel(uint nChannel, float fLevelDB, [MarshalAs(UnmanagedType.LPStruct)] Guid pguidEventContext);
    [PreserveSig] int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, [MarshalAs(UnmanagedType.LPStruct)] Guid pguidEventContext);
    [PreserveSig] int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
    [PreserveSig] int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
    [PreserveSig] int SetMute(bool bMute, [MarshalAs(UnmanagedType.LPStruct)] Guid pguidEventContext);
    [PreserveSig] int GetMute(out bool pbMute);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumeratorComObject { }

public class CoreAudioMixer {
    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int GetCountDelegate(IntPtr thisPtr, out int count);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int GetSessionDelegate(IntPtr thisPtr, int index, out IntPtr session);

    private static IMMDevice GetDefaultRenderDevice() {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice dev;
            enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            return dev;
        } catch {
            return null;
        }
    }

    public static string GetSessions() {
        try {
            var dev = GetDefaultRenderDevice();
            if (dev == null) return "[]";
            Guid iid = typeof(IAudioSessionManager2).GUID;
            object o;
            dev.Activate(iid, 1, IntPtr.Zero, out o);
            var mgr = (IAudioSessionManager2)o;
            if (mgr == null) return "[]";

            IntPtr enumPtr;
            int hr = mgr.GetSessionEnumerator(out enumPtr);
            if (hr != 0 || enumPtr == IntPtr.Zero) return "[]";

            IntPtr vtable = Marshal.ReadIntPtr(enumPtr);
            IntPtr getCountPtr = Marshal.ReadIntPtr(vtable, 3 * IntPtr.Size);
            IntPtr getSessionPtr = Marshal.ReadIntPtr(vtable, 4 * IntPtr.Size);

            var getCount = (GetCountDelegate)Marshal.GetDelegateForFunctionPointer(getCountPtr, typeof(GetCountDelegate));
            var getSession = (GetSessionDelegate)Marshal.GetDelegateForFunctionPointer(getSessionPtr, typeof(GetSessionDelegate));

            int count = 0;
            getCount(enumPtr, out count);

            var list = new List<string>();
            var seenPids = new HashSet<uint>();

            for (int i = 0; i < count; i++) {
                IntPtr sPtr;
                getSession(enumPtr, i, out sPtr);
                if (sPtr == IntPtr.Zero) continue;

                var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sPtr);
                var vol = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(sPtr);

                uint pid = 0;
                ctl.GetProcessId(out pid);
                if (seenPids.Contains(pid) || pid == 0) continue;
                seenPids.Add(pid);

                float level = 1.0f;
                vol.GetMasterVolume(out level);

                bool isMuted = false;
                vol.GetMute(out isMuted);

                string procName = "System";
                try {
                    var p = Process.GetProcessById((int)pid);
                    procName = p.ProcessName;
                } catch {}

                list.Add(string.Format(CultureInfo.InvariantCulture, "{{\"pid\":{0},\"processName\":\"{1}\",\"volume\":{2},\"isMuted\":{3}}}",
                    pid, procName.Replace("\\", "\\\\").Replace("\"", "\\\""), (int)Math.Round(level * 100), isMuted ? "true" : "false"));
            }

            return "[" + string.Join(",", list.ToArray()) + "]";
        } catch {
            return "[]";
        }
    }

    public static string GetPeakLevels() {
        try {
            var dev = GetDefaultRenderDevice();
            if (dev == null) return "{\"master\":0.0}";

            float masterPeak = 0f;
            Guid meterId = typeof(IAudioMeterInformation).GUID;
            object meterObj;
            dev.Activate(meterId, 1, IntPtr.Zero, out meterObj);
            var masterMeter = (IAudioMeterInformation)meterObj;
            if (masterMeter != null) {
                masterMeter.GetPeakValue(out masterPeak);
            }

            var map = new List<string>();
            map.Add(string.Format(CultureInfo.InvariantCulture, "\"master\":{0:F2}", masterPeak));

            Guid iid = typeof(IAudioSessionManager2).GUID;
            object o;
            dev.Activate(iid, 1, IntPtr.Zero, out o);
            var mgr = (IAudioSessionManager2)o;
            if (mgr != null) {
                IntPtr enumPtr;
                if (mgr.GetSessionEnumerator(out enumPtr) == 0 && enumPtr != IntPtr.Zero) {
                    IntPtr vtable = Marshal.ReadIntPtr(enumPtr);
                    IntPtr getCountPtr = Marshal.ReadIntPtr(vtable, 3 * IntPtr.Size);
                    IntPtr getSessionPtr = Marshal.ReadIntPtr(vtable, 4 * IntPtr.Size);

                    var getCount = (GetCountDelegate)Marshal.GetDelegateForFunctionPointer(getCountPtr, typeof(GetCountDelegate));
                    var getSession = (GetSessionDelegate)Marshal.GetDelegateForFunctionPointer(getSessionPtr, typeof(GetSessionDelegate));

                    int count = 0;
                    getCount(enumPtr, out count);
                    var seenPids = new HashSet<uint>();

                    for (int i = 0; i < count; i++) {
                        IntPtr sPtr;
                        getSession(enumPtr, i, out sPtr);
                        if (sPtr == IntPtr.Zero) continue;

                        var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sPtr);
                        var meter = (IAudioMeterInformation)Marshal.GetObjectForIUnknown(sPtr);

                        uint pid = 0;
                        ctl.GetProcessId(out pid);
                        if (seenPids.Contains(pid) || pid == 0) continue;
                        seenPids.Add(pid);

                        float peak = 0f;
                        if (meter != null) {
                            meter.GetPeakValue(out peak);
                        }

                        try {
                            var p = Process.GetProcessById((int)pid);
                            map.Add(string.Format(CultureInfo.InvariantCulture, "\"{0}\":{1:F2}", p.ProcessName.ToLower(), peak));
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
            var dev = GetDefaultRenderDevice();
            if (dev == null) return false;
            Guid iid = typeof(IAudioSessionManager2).GUID;
            object o;
            dev.Activate(iid, 1, IntPtr.Zero, out o);
            var mgr = (IAudioSessionManager2)o;
            if (mgr == null) return false;

            IntPtr enumPtr;
            if (mgr.GetSessionEnumerator(out enumPtr) != 0 || enumPtr == IntPtr.Zero) return false;

            IntPtr vtable = Marshal.ReadIntPtr(enumPtr);
            IntPtr getCountPtr = Marshal.ReadIntPtr(vtable, 3 * IntPtr.Size);
            IntPtr getSessionPtr = Marshal.ReadIntPtr(vtable, 4 * IntPtr.Size);

            var getCount = (GetCountDelegate)Marshal.GetDelegateForFunctionPointer(getCountPtr, typeof(GetCountDelegate));
            var getSession = (GetSessionDelegate)Marshal.GetDelegateForFunctionPointer(getSessionPtr, typeof(GetSessionDelegate));

            int count = 0;
            getCount(enumPtr, out count);

            for (int i = 0; i < count; i++) {
                IntPtr sPtr;
                getSession(enumPtr, i, out sPtr);
                if (sPtr == IntPtr.Zero) continue;

                var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sPtr);
                var vol = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(sPtr);

                uint pid = 0;
                ctl.GetProcessId(out pid);
                if (pid > 0) {
                    try {
                        var p = Process.GetProcessById((int)pid);
                        if (p.ProcessName.IndexOf(processName, StringComparison.OrdinalIgnoreCase) >= 0 ||
                            processName.IndexOf(p.ProcessName, StringComparison.OrdinalIgnoreCase) >= 0) {
                            vol.SetMasterVolume(level, Guid.Empty);
                        }
                    } catch {}
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    public static bool SetProcessMute(string processName, bool isMuted) {
        try {
            var dev = GetDefaultRenderDevice();
            if (dev == null) return false;
            Guid iid = typeof(IAudioSessionManager2).GUID;
            object o;
            dev.Activate(iid, 1, IntPtr.Zero, out o);
            var mgr = (IAudioSessionManager2)o;
            if (mgr == null) return false;

            IntPtr enumPtr;
            if (mgr.GetSessionEnumerator(out enumPtr) != 0 || enumPtr == IntPtr.Zero) return false;

            IntPtr vtable = Marshal.ReadIntPtr(enumPtr);
            IntPtr getCountPtr = Marshal.ReadIntPtr(vtable, 3 * IntPtr.Size);
            IntPtr getSessionPtr = Marshal.ReadIntPtr(vtable, 4 * IntPtr.Size);

            var getCount = (GetCountDelegate)Marshal.GetDelegateForFunctionPointer(getCountPtr, typeof(GetCountDelegate));
            var getSession = (GetSessionDelegate)Marshal.GetDelegateForFunctionPointer(getSessionPtr, typeof(GetSessionDelegate));

            int count = 0;
            getCount(enumPtr, out count);

            for (int i = 0; i < count; i++) {
                IntPtr sPtr;
                getSession(enumPtr, i, out sPtr);
                if (sPtr == IntPtr.Zero) continue;

                var ctl = (IAudioSessionControl2)Marshal.GetObjectForIUnknown(sPtr);
                var vol = (ISimpleAudioVolume)Marshal.GetObjectForIUnknown(sPtr);

                uint pid = 0;
                ctl.GetProcessId(out pid);
                if (pid > 0) {
                    try {
                        var p = Process.GetProcessById((int)pid);
                        if (p.ProcessName.IndexOf(processName, StringComparison.OrdinalIgnoreCase) >= 0 ||
                            processName.IndexOf(p.ProcessName, StringComparison.OrdinalIgnoreCase) >= 0) {
                            vol.SetMute(isMuted, Guid.Empty);
                        }
                    } catch {}
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    public static bool SetMasterVolume(float level) {
        try {
            var dev = GetDefaultRenderDevice();
            if (dev == null) return false;
            Guid iid = typeof(IAudioEndpointVolume).GUID;
            object o;
            dev.Activate(iid, 1, IntPtr.Zero, out o);
            var masterVol = (IAudioEndpointVolume)o;
            if (masterVol == null) return false;
            masterVol.SetMasterVolumeLevelScalar(level, Guid.Empty);
            return true;
        } catch {
            return false;
        }
    }

    public static bool SetMasterMute(bool isMuted) {
        try {
            var dev = GetDefaultRenderDevice();
            if (dev == null) return false;
            Guid iid = typeof(IAudioEndpointVolume).GUID;
            object o;
            dev.Activate(iid, 1, IntPtr.Zero, out o);
            var masterVol = (IAudioEndpointVolume)o;
            if (masterVol == null) return false;
            masterVol.SetMute(isMuted, Guid.Empty);
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
