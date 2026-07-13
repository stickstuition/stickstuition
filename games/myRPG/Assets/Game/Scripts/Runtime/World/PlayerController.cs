using MyRPG.Core;
using UnityEngine;

namespace MyRPG.World
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class PlayerController : MonoBehaviour
    {
        [SerializeField, Min(1f)] private float movementSpeed = 5f;
        [SerializeField, Min(1f)] private float turnSpeed = 12f;
        [SerializeField] private Transform cameraTransform;
        private CharacterController _controller;
        private float _verticalVelocity;

        public bool CanMove => GameBootstrap.Instance == null || GameBootstrap.Instance.State == GameState.Exploring;

        private void Awake() => _controller = GetComponent<CharacterController>();

        private void Start()
        {
            if (cameraTransform == null && Camera.main != null) cameraTransform = Camera.main.transform;
            RestorePosition();
            GameBootstrap.Instance?.ChangeState(GameState.Exploring);
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape)) TogglePause();
            if (!CanMove) return;

            Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
            Vector3 move = new Vector3(input.x, 0f, input.y);
            if (cameraTransform != null)
            {
                Vector3 forward = cameraTransform.forward; forward.y = 0f; forward.Normalize();
                Vector3 right = cameraTransform.right; right.y = 0f; right.Normalize();
                move = right * input.x + forward * input.y;
            }
            if (move.sqrMagnitude > 1f) move.Normalize();
            if (move.sqrMagnitude > 0.01f)
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(move), turnSpeed * Time.deltaTime);

            if (_controller.isGrounded && _verticalVelocity < 0f) _verticalVelocity = -2f;
            _verticalVelocity += Physics.gravity.y * Time.deltaTime;
            Vector3 velocity = move * movementSpeed + Vector3.up * _verticalVelocity;
            _controller.Move(velocity * Time.deltaTime);
        }

        private void TogglePause()
        {
            GameBootstrap bootstrap = GameBootstrap.Instance;
            if (bootstrap == null) return;
            if (bootstrap.State == GameState.Exploring) { bootstrap.ChangeState(GameState.Paused); Time.timeScale = 0f; WorldUI.Instance?.SetPaused(true); }
            else if (bootstrap.State == GameState.Paused) { Time.timeScale = 1f; bootstrap.ChangeState(GameState.Exploring); WorldUI.Instance?.SetPaused(false); }
        }

        public void Warp(Vector3 position)
        {
            _controller.enabled = false;
            transform.position = position;
            _verticalVelocity = 0f;
            _controller.enabled = true;
        }

        private void RestorePosition()
        {
            var session = GameBootstrap.Instance?.Session;
            if (session == null || !session.HasActiveSave) return;
            var p = session.Save.playerPosition;
            if (p.x == 0f && p.y == 0f && p.z == 0f) return;
            _controller.enabled = false;
            transform.position = new Vector3(p.x, p.y, p.z);
            _controller.enabled = true;
        }
    }
}
