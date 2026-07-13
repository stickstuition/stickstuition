using UnityEngine;

namespace MyRPG.World
{
    public sealed class IsometricCamera : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 offset = new Vector3(9f, 11f, -9f);
        [SerializeField, Min(1f)] private float followSharpness = 8f;
        [SerializeField, Min(10f)] private float rotationSpeed = 70f;
        private float _yaw;
        private float _shakeTime;
        private float _shakeStrength;

        public void Shake(float duration, float strength) { _shakeTime = duration; _shakeStrength = strength; }

        public void SetTarget(Transform value) => target = value;

        private void LateUpdate()
        {
            if (target == null) return;
            float direction = 0f;
            if (Input.GetKey(KeyCode.Q)) direction -= 1f;
            if (Input.GetKey(KeyCode.E)) direction += 1f;
            _yaw += direction * rotationSpeed * Time.unscaledDeltaTime;
            Vector3 rotatedOffset = Quaternion.Euler(0f, _yaw, 0f) * offset;
            Vector3 desired = target.position + rotatedOffset;
            if (_shakeTime > 0f) { _shakeTime -= Time.unscaledDeltaTime; desired += Random.insideUnitSphere * _shakeStrength; }
            transform.position = Vector3.Lerp(transform.position, desired, 1f - Mathf.Exp(-followSharpness * Time.unscaledDeltaTime));
            transform.rotation = Quaternion.LookRotation(target.position + Vector3.up * 1.2f - transform.position, Vector3.up);
        }
    }
}
