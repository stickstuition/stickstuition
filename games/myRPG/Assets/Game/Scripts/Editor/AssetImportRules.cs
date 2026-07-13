using UnityEditor;
using UnityEngine;

namespace MyRPG.Editor
{
    /// <summary>Applies repeatable import settings to selected third-party production assets.</summary>
    public sealed class AssetImportRules : AssetPostprocessor
    {
        private void OnPreprocessModel()
        {
            if (!assetPath.StartsWith("Assets/ThirdParty/KayKit/"))
            {
                return;
            }

            ModelImporter importer = (ModelImporter)assetImporter;
            importer.importCameras = false;
            importer.importLights = false;
            importer.isReadable = false;
            importer.materialImportMode = ModelImporterMaterialImportMode.ImportStandard;

            if (assetPath.Contains("/Characters/") || assetPath.Contains("/Animations/"))
            {
                importer.animationType = ModelImporterAnimationType.Generic;
                importer.importAnimation = true;
            }
        }

        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith("Assets/ThirdParty/UI/") &&
                !assetPath.StartsWith("Assets/ThirdParty/Icons/"))
            {
                return;
            }

            TextureImporter importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.alphaIsTransparency = true;
            importer.mipmapEnabled = false;
        }

        private void OnPreprocessAudio()
        {
            if (!assetPath.StartsWith("Assets/ThirdParty/Audio/"))
            {
                return;
            }

            AudioImporter importer = (AudioImporter)assetImporter;
            AudioImporterSampleSettings settings = importer.defaultSampleSettings;
            settings.compressionFormat = AudioCompressionFormat.Vorbis;
            settings.quality = 0.65f;
            settings.loadType = assetPath.Contains("BGS Loops")
                ? AudioClipLoadType.Streaming
                : AudioClipLoadType.CompressedInMemory;
            settings.preloadAudioData = !assetPath.Contains("BGS Loops");
            importer.defaultSampleSettings = settings;
        }
    }
}
