using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;

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

public class Program {
    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int GetCountDelegate(IntPtr thisPtr, out int count);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    private delegate int GetSessionDelegate(IntPtr thisPtr, int index, out IntPtr session);

    private static IMMDevice GetDefaultRenderDevice() {
        try {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice dev;
            int hr = enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (hr == 0 && dev != null) return dev;
            return null;
        } catch {
            return null;
        }
    }

    private static string NormalizeName(string name) {
        if (string.IsNullOrEmpty(name)) return "";
        try {
            name = Path.GetFileNameWithoutExtension(name);
        } catch {}
        return name.Trim().ToLowerInvariant();
    }

    public static string GetSessionsJson() {
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

    public static string GetPeaksJson() {
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
                            string cleanName = NormalizeName(p.ProcessName);
                            if (!string.IsNullOrEmpty(cleanName)) {
                                map.Add(string.Format(CultureInfo.InvariantCulture, "\"{0}\":{1:F2}", cleanName, peak));
                            }
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
            string target = NormalizeName(processName);
            if (string.IsNullOrEmpty(target)) return false;

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
            bool matched = false;

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
                        string procName = NormalizeName(p.ProcessName);
                        if (procName == target || procName.Contains(target) || target.Contains(procName)) {
                            Guid g = Guid.Empty;
                            vol.SetMasterVolume(level, ref g);
                            matched = true;
                        }
                    } catch {}
                }
            }
            return matched;
        } catch {
            return false;
        }
    }

    public static bool SetProcessMute(string processName, bool isMuted) {
        try {
            string target = NormalizeName(processName);
            if (string.IsNullOrEmpty(target)) return false;

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
            bool matched = false;

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
                        string procName = NormalizeName(p.ProcessName);
                        if (procName == target || procName.Contains(target) || target.Contains(procName)) {
                            Guid g = Guid.Empty;
                            vol.SetMute(isMuted, ref g);
                            matched = true;
                        }
                    } catch {}
                }
            }
            return matched;
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
            Guid g = Guid.Empty;
            masterVol.SetMasterVolumeLevelScalar(level, ref g);
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
            Guid g = Guid.Empty;
            masterVol.SetMute(isMuted, ref g);
            return true;
        } catch {
            return false;
        }
    }

    public static void Main(string[] args) {
        Console.OutputEncoding = Encoding.UTF8;

        if (args.Length > 0 && args[0] != "server") {
            string action = args[0].ToLowerInvariant();
            if (action == "list") {
                Console.WriteLine(GetSessionsJson());
            } else if (action == "peaks") {
                Console.WriteLine(GetPeaksJson());
            } else if (action == "set-master-volume" && args.Length > 1) {
                float v = float.Parse(args[1], CultureInfo.InvariantCulture);
                Console.WriteLine(SetMasterVolume(v));
            } else if (action == "set-master-mute" && args.Length > 1) {
                bool m = bool.Parse(args[1]);
                Console.WriteLine(SetMasterMute(m));
            } else if (action == "set-process-volume" && args.Length > 2) {
                float v = float.Parse(args[2], CultureInfo.InvariantCulture);
                Console.WriteLine(SetProcessVolume(args[1], v));
            } else if (action == "set-process-mute" && args.Length > 2) {
                bool m = bool.Parse(args[2]);
                Console.WriteLine(SetProcessMute(args[1], m));
            }
            return;
        }

        // Standard JSON RPC Protocol loop
        while (true) {
            string line = Console.ReadLine();
            if (line == null || line == "exit") break;
            if (string.IsNullOrWhiteSpace(line)) continue;

            int reqId = ExtractJsonInt(line, "id", 0);

            try {
                if (line.Contains("\"peaks\"")) {
                    string peaks = GetPeaksJson();
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":{1}}}", reqId, peaks));
                } else if (line.Contains("\"list\"")) {
                    string sessions = GetSessionsJson();
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":{1}}}", reqId, sessions));
                } else if (line.Contains("\"set-process-volume\"")) {
                    string proc = ExtractJsonString(line, "processName");
                    float vol = ExtractJsonFloat(line, "volume", 1.0f);
                    bool res = SetProcessVolume(proc, vol);
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":{1}}}", reqId, res ? "true" : "false"));
                } else if (line.Contains("\"set-process-mute\"")) {
                    string proc = ExtractJsonString(line, "processName");
                    bool muted = ExtractJsonBool(line, "isMuted");
                    bool res = SetProcessMute(proc, muted);
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":{1}}}", reqId, res ? "true" : "false"));
                } else if (line.Contains("\"set-master-volume\"")) {
                    float vol = ExtractJsonFloat(line, "volume", 1.0f);
                    bool res = SetMasterVolume(vol);
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":{1}}}", reqId, res ? "true" : "false"));
                } else if (line.Contains("\"set-master-mute\"")) {
                    bool muted = ExtractJsonBool(line, "isMuted");
                    bool res = SetMasterMute(muted);
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":{1}}}", reqId, res ? "true" : "false"));
                } else {
                    Console.WriteLine(string.Format("{{\"id\":{0},\"data\":null}}", reqId));
                }
            } catch {
                Console.WriteLine(string.Format("{{\"id\":{0},\"error\":true}}", reqId));
            }
        }
    }

    private static string ExtractJsonString(string json, string key) {
        string pattern = "\"" + key + "\":\"";
        int idx = json.IndexOf(pattern);
        if (idx < 0) return "";
        idx += pattern.Length;
        int end = json.IndexOf("\"", idx);
        if (end < 0) return "";
        return json.Substring(idx, end - idx);
    }

    private static int ExtractJsonInt(string json, string key, int defaultVal) {
        string pattern = "\"" + key + "\":";
        int idx = json.IndexOf(pattern);
        if (idx < 0) return defaultVal;
        idx += pattern.Length;
        int end = json.IndexOfAny(new char[] { ',', '}', ' ' }, idx);
        if (end < 0) end = json.Length;
        string val = json.Substring(idx, end - idx).Trim();
        int i;
        if (int.TryParse(val, out i)) return i;
        return defaultVal;
    }

    private static float ExtractJsonFloat(string json, string key, float defaultVal) {
        string pattern = "\"" + key + "\":";
        int idx = json.IndexOf(pattern);
        if (idx < 0) return defaultVal;
        idx += pattern.Length;
        int end = json.IndexOfAny(new char[] { ',', '}', ' ' }, idx);
        if (end < 0) end = json.Length;
        string val = json.Substring(idx, end - idx).Trim();
        float f;
        if (float.TryParse(val, NumberStyles.Any, CultureInfo.InvariantCulture, out f)) return f;
        return defaultVal;
    }

    private static bool ExtractJsonBool(string json, string key) {
        string pattern = "\"" + key + "\":";
        int idx = json.IndexOf(pattern);
        if (idx < 0) return false;
        idx += pattern.Length;
        return json.IndexOf("true", idx, StringComparison.OrdinalIgnoreCase) == idx;
    }
}
