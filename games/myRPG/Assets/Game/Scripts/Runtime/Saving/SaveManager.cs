using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace MyRPG.Saving
{
    public enum SaveLoadStatus { Success, Empty, Corrupt, UnsupportedVersion, InvalidSlot }

    public sealed class SaveManager
    {
        public const int SlotCount = 3;
        private readonly string _rootPath;

        public SaveManager(string rootPath = null)
        {
            _rootPath = string.IsNullOrWhiteSpace(rootPath)
                ? Path.Combine(Application.persistentDataPath, "Saves")
                : rootPath;
        }

        public void Save(int slot, SaveData data)
        {
            ValidateSlot(slot);
            if (data == null) throw new ArgumentNullException(nameof(data));
            Directory.CreateDirectory(_rootPath);
            data.Normalize();
            data.lastPlayedUtc = DateTime.UtcNow.ToString("O");

            string payload = JsonUtility.ToJson(data);
            SaveEnvelope envelope = new SaveEnvelope
            {
                version = SaveData.CurrentVersion,
                payload = payload,
                checksum = Checksum(payload)
            };
            AtomicWrite(SlotPath(slot), BackupPath(slot), JsonUtility.ToJson(envelope, true));
        }

        public SaveLoadStatus TryLoad(int slot, out SaveData data)
        {
            data = null;
            if (!IsValidSlot(slot)) return SaveLoadStatus.InvalidSlot;
            string primary = SlotPath(slot);
            string backup = BackupPath(slot);
            if (!File.Exists(primary) && !File.Exists(backup)) return SaveLoadStatus.Empty;

            SaveLoadStatus status = TryRead(primary, out data);
            if (status == SaveLoadStatus.Success) return status;

            SaveLoadStatus backupStatus = TryRead(backup, out data);
            if (backupStatus == SaveLoadStatus.Success)
            {
                File.Copy(backup, primary, true);
                return SaveLoadStatus.Success;
            }
            return status == SaveLoadStatus.UnsupportedVersion ? status : backupStatus;
        }

        public bool HasSave(int slot)
        {
            return IsValidSlot(slot) && (File.Exists(SlotPath(slot)) || File.Exists(BackupPath(slot)));
        }

        public void Delete(int slot)
        {
            ValidateSlot(slot);
            DeleteIfExists(SlotPath(slot));
            DeleteIfExists(BackupPath(slot));
            DeleteIfExists(TempPath(slot));
        }

        private SaveLoadStatus TryRead(string path, out SaveData data)
        {
            data = null;
            if (!File.Exists(path)) return SaveLoadStatus.Empty;
            try
            {
                SaveEnvelope envelope = JsonUtility.FromJson<SaveEnvelope>(File.ReadAllText(path));
                if (envelope == null || string.IsNullOrEmpty(envelope.payload) || envelope.checksum != Checksum(envelope.payload))
                    return SaveLoadStatus.Corrupt;
                if (envelope.version > SaveData.CurrentVersion) return SaveLoadStatus.UnsupportedVersion;
                data = JsonUtility.FromJson<SaveData>(envelope.payload);
                if (data == null || string.IsNullOrWhiteSpace(data.saveId)) return SaveLoadStatus.Corrupt;
                if (data.version > SaveData.CurrentVersion) return SaveLoadStatus.UnsupportedVersion;
                Migrate(data);
                data.Normalize();
                return SaveLoadStatus.Success;
            }
            catch (Exception exception) when (exception is IOException || exception is UnauthorizedAccessException || exception is ArgumentException)
            {
                return SaveLoadStatus.Corrupt;
            }
        }

        private static void Migrate(SaveData data)
        {
            if (data.version < 1) data.version = 1;
            if (data.version == 1)
            {
                data.upgrades ??= new System.Collections.Generic.List<UpgradeRankEntry>();
                data.version = 2;
            }
        }

        private static void AtomicWrite(string primary, string backup, string content)
        {
            string temp = primary + ".tmp";
            File.WriteAllText(temp, content, new UTF8Encoding(false));
            if (File.Exists(primary))
            {
                try
                {
                    File.Replace(temp, primary, backup);
                    return;
                }
                catch (PlatformNotSupportedException) { }
                catch (IOException) { }
                File.Copy(primary, backup, true);
                File.Delete(primary);
            }
            File.Move(temp, primary);
        }

        private static string Checksum(string value)
        {
            using SHA256 sha = SHA256.Create();
            return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(value)));
        }

        private string SlotPath(int slot) => Path.Combine(_rootPath, $"slot-{slot + 1}.json");
        private string BackupPath(int slot) => SlotPath(slot) + ".bak";
        private string TempPath(int slot) => SlotPath(slot) + ".tmp";
        private static bool IsValidSlot(int slot) => slot >= 0 && slot < SlotCount;
        private static void ValidateSlot(int slot) { if (!IsValidSlot(slot)) throw new ArgumentOutOfRangeException(nameof(slot)); }
        private static void DeleteIfExists(string path) { if (File.Exists(path)) File.Delete(path); }

        [Serializable]
        private sealed class SaveEnvelope
        {
            public int version;
            public string payload;
            public string checksum;
        }
    }
}
