using MyRPG.Core;
using MyRPG.Saving;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace MyRPG.UI
{
    public sealed class EndingController : MonoBehaviour
    {
        private void Start()
        {
            SaveData save = GameBootstrap.Instance?.Session?.Save;
            if (save == null) { GameBootstrap.Instance?.LoadGameplayScene(SceneNames.MainMenu); return; }
            Build(save);
            GameBootstrap.Instance.ChangeState(GameState.Transition);
        }

        private void Build(SaveData save)
        {
            Canvas canvas = new GameObject("Ending Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay; CanvasScaler scaler=canvas.GetComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1280,720);
            if (FindFirstObjectByType<EventSystem>() == null) new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            Image background=Panel(canvas.transform,Vector2.zero,Vector2.one,new Color(0.08f,0.15f,0.22f));
            Image card=Panel(background.transform,new Vector2(0.18f,0.07f),new Vector2(0.82f,0.94f),new Color(0.92f,0.86f,0.70f));
            Text title=Label(card.transform,46,TextAnchor.MiddleCenter,new Vector2(0.06f,0.84f),new Vector2(0.94f,0.97f));title.text=$"{save.adventurerName} Saved the Great Adventure!";
            string strongest="Keep practising",practice="Keep practising";
            float best=-1f,worst=2f;
            foreach(SubtopicPerformance topic in save.performance.subtopics)
            {
                if(topic.answered==0)continue;
                if(topic.Accuracy>best){best=topic.Accuracy;strongest=topic.subtopicId;}
                if(topic.Accuracy<worst){worst=topic.Accuracy;practice=topic.subtopicId;}
            }
            Text report=Label(card.transform,24,TextAnchor.MiddleCenter,new Vector2(0.08f,0.25f),new Vector2(0.92f,0.82f));
            report.text=$"Final Grade: {save.performance.ChapterGrade()}\n\nQuestions answered: {save.performance.totalAnswered}\n" +
                $"Overall accuracy: {save.performance.Accuracy*100f:0}%\nBest streak: {save.performance.bestStreak}\n" +
                $"Knowledge earned: {save.knowledgePoints}\nStrongest area: {strongest}\nSuggested practice: {practice}\n\n" +
                $"Party rescued: {save.unlockedCompanions.Count}/3\nThe Bone King has been defeated!";
            Button menu=MakeButton(card.transform,"Return to Main Menu",new Vector2(0.18f,0.08f),new Vector2(0.48f,0.20f));menu.onClick.AddListener(()=>GameBootstrap.Instance.LoadGameplayScene(SceneNames.MainMenu));
            Button again=MakeButton(card.transform,"New Adventure",new Vector2(0.52f,0.08f),new Vector2(0.82f,0.20f));again.onClick.AddListener(()=>{GameBootstrap.Instance.Session.Clear();GameBootstrap.Instance.LoadGameplayScene(SceneNames.MainMenu);});
        }
        private static Image Panel(Transform p,Vector2 min,Vector2 max,Color c){Image i=new GameObject("Panel",typeof(RectTransform),typeof(Image)).GetComponent<Image>();i.transform.SetParent(p,false);RectTransform r=i.rectTransform;r.anchorMin=min;r.anchorMax=max;r.offsetMin=Vector2.zero;r.offsetMax=Vector2.zero;i.color=c;return i;}
        private static Text Label(Transform p,int size,TextAnchor a,Vector2 min,Vector2 max){Text t=new GameObject("Text",typeof(RectTransform),typeof(Text)).GetComponent<Text>();t.transform.SetParent(p,false);RectTransform r=t.rectTransform;r.anchorMin=min;r.anchorMax=max;r.offsetMin=Vector2.zero;r.offsetMax=Vector2.zero;t.font=Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");t.fontSize=size;t.alignment=a;t.color=new Color(0.14f,0.11f,0.09f);return t;}
        private static Button MakeButton(Transform p,string text,Vector2 min,Vector2 max){Image i=Panel(p,min,max,new Color(0.22f,0.48f,0.68f));Button b=i.gameObject.AddComponent<Button>();Text l=Label(i.transform,21,TextAnchor.MiddleCenter,Vector2.zero,Vector2.one);l.text=text;l.color=Color.white;return b;}
    }
}
