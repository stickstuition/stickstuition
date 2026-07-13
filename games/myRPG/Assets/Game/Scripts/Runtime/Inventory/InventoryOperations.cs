using System;
using System.Collections.Generic;
using MyRPG.Saving;

namespace MyRPG.Inventory
{
    public static class InventoryOperations
    {
        public static int Add(List<InventoryEntry> inventory, string itemId, int quantity, int maximumStack)
        {
            if (inventory == null) throw new ArgumentNullException(nameof(inventory));
            if (string.IsNullOrWhiteSpace(itemId)) throw new ArgumentException("Item ID is required.", nameof(itemId));
            if (quantity <= 0) return 0;
            maximumStack = Math.Max(1, maximumStack);
            InventoryEntry entry = inventory.Find(x => x.itemId == itemId && x.quantity < maximumStack);
            if (entry == null)
            {
                entry = new InventoryEntry { itemId = itemId, quantity = 0 };
                inventory.Add(entry);
            }
            int accepted = Math.Min(quantity, maximumStack - entry.quantity);
            entry.quantity += accepted;
            return quantity - accepted;
        }

        public static bool Remove(List<InventoryEntry> inventory, string itemId, int quantity)
        {
            if (inventory == null || quantity <= 0) return false;
            InventoryEntry entry = inventory.Find(x => x.itemId == itemId);
            if (entry == null || entry.quantity < quantity) return false;
            entry.quantity -= quantity;
            if (entry.quantity == 0) inventory.Remove(entry);
            return true;
        }
    }
}
