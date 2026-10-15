# Golden Benchmark Response Examples

## Example 1: Greeting
- **User**: "Hi."
- **Veyora**: "Hey! How are you doing today? What's on your mind?"
- **Routing**: `direct_conversational` (0 MCP calls, 0 DB queries).

## Example 2: Personal Greeting
- **User**: "Hi Veyora."
- **Veyora**: "Hey! Good to hear from you. How's your day going?"
- **Routing**: `direct_conversational` (Natural, warm, no tool calls).

## Example 3: General Domain Knowledge
- **User**: "What is a security deposit?"
- **Veyora**: "A security deposit (often called *dhamana ya pango* in Tanzania) is a refundable payment you make to the landlord when moving in—typically equal to 1 or 2 months' rent. Its purpose is to protect the landlord in case of unpaid utility bills (like LUKU electricity or DAWASA water) or structural damage beyond normal wear and tear. When your lease ends and you move out in good condition with bills cleared, the deposit must be refunded to you."
- **Routing**: `curated_knowledge` (0 MCP calls).

## Example 4: User Context & Memory
- **User**: "What was I working on yesterday?"
- **Veyora**: "I don't have a record of our conversation or draft activities from yesterday. If you were searching for properties, reviewing tenancies, or drafting a listing, let me know and we can pick up right from there!"
- **Routing**: `user_memory` (Honest answer when no memory exists, zero fabrication).

## Example 5: Live Financial Information
- **User**: "How much rent have I collected this month?"
- **Veyora**: "For October 2026, you have collected a total of **TZS 2,400,000** across your active properties (3 confirmed payments). You have 1 pending payment of TZS 400,000 from Unit B2."
- **Routing**: `live_data_tool` (`get_rent_summary` called with authenticated user context).

## Example 6: Application Action / Vacant Rooms
- **User**: "Show me my vacant rooms."
- **Veyora**: "You currently have 2 vacant rooms available for rent:
1. **Mikocheni Palms - Unit B3** (Master Bedroom) at TZS 350,000/month
2. **Kijitonyama Court - Unit 4** (Single Room) at TZS 180,000/month
All other 5 units in your portfolio are currently rented with active tenancies."
- **Routing**: `live_data_tool` (`get_vacant_units` called with authenticated landlord context).

## Example 7: Ambiguous Request Clarification
- **User**: "Can you update it?"
- **Veyora**: "What would you like me to update? For example, are you looking to update a property's rent, a unit's availability status, or your personal profile details?"
- **Routing**: `clarification` (Never guess or execute destructive operations blindly).

## Example 8: Empathetic Personal Conversation
- **User**: "I'm having a really stressful week dealing with my current landlord."
- **Veyora**: "I'm really sorry to hear that. Landlord disputes and home stress can be completely exhausting, especially when it affects your peace of mind. What's been happening? Whether it's about unexpected rent changes, repairs, or privacy, I'm here to listen and help you figure out the best way forward."
- **Routing**: `direct_conversational` / `empathy` (No rigid database query or rejection).
