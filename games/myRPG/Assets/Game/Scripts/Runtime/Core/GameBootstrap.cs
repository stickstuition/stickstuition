using System;
using UnityEngine;
using UnityEngine.SceneManagement;
using MyRPG.Settings;
using MyRPG.Saving;
using System.Collections;
using UnityEngine.UI;

namespace MyRPG.Core
{
    /// <summary>Owns the application state and persistent service root.</summary>
    [DefaultExecutionOrder(-1000)]
    public sealed class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }

        public GameState State { get; private set; } = GameState.Booting;
        public GameSession Session { get; private set; }

        public event Action<GameState, GameState> StateChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            Session = new GameSession(new SaveManager());
            Application.targetFrameRate = 60;
            SettingsManager.Apply(SettingsManager.Load());
        }

        private void Start()
        {
            if (SceneManager.GetActiveScene().name == SceneNames.Boot)
            {
                SceneManager.LoadSceneAsync(SceneNames.MainMenu, LoadSceneMode.Single);
            }
        }

        public void ChangeState(GameState next)
        {
            if (State == next)
            {
                return;
            }

            GameState previous = State;
            State = next;
            StateChanged?.Invoke(previous, next);
        }

        public void LoadGameplayScene(string sceneName)
        {
            StartCoroutine(LoadSceneWithOverlay(sceneName));
        }

        private IEnumerator LoadSceneWithOverlay(string sceneName)
        {
            ChangeState(GameState.Transition);
            GameObject overlay = new GameObject("Loading Overlay", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            DontDestroyOnLoad(overlay); Canvas canvas = overlay.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay; canvas.sortingOrder = 1000;
            Image shade = new GameObject("Shade", typeof(Image)).GetComponent<Image>(); shade.transform.SetParent(overlay.transform, false); shade.color = new Color(.03f,.06f,.10f,1f);
            shade.rectTransform.anchorMin=Vector2.zero; shade.rectTransform.anchorMax=Vector2.one; shade.rectTransform.offsetMin=shade.rectTransform.offsetMax=Vector2.zero;
            Text text = new GameObject("Loading", typeof(Text)).GetComponent<Text>(); text.transform.SetParent(overlay.transform,false); text.font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); text.text="Loading your adventure..."; text.fontSize=28; text.alignment=TextAnchor.MiddleCenter; text.color=Color.white;
            text.rectTransform.anchorMin=new Vector2(.2f,.4f);text.rectTransform.anchorMax=new Vector2(.8f,.6f);text.rectTransform.offsetMin=text.rectTransform.offsetMax=Vector2.zero;
            yield return null;
            AsyncOperation operation = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            while (operation != null && !operation.isDone) { text.text = $"Loading your adventure...  {Mathf.RoundToInt(operation.progress * 100f)}%"; yield return null; }
            Destroy(overlay);
        }
    }
}
