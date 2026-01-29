document.addEventListener("DOMContentLoaded", async () => {
    await updateUnreadBadge();
});

async function updateUnreadBadge() {
    try {
        const response = await fetch("/api/admin/messages/unread-count", { credentials: "include" });
        if (!response.ok) {
            console.warn("Failed to fetch unread count:", response.status);
            return;
        }

        const data = await response.json();
        const count = data.count;

        const messageLinks = document.querySelectorAll('a[href*="adminMessages.html"]');

        messageLinks.forEach(link => {
            // Remove existing badge if any
            const existingBadge = link.querySelector(".badge");
            if (existingBadge) existingBadge.remove();

            if (count > 0) {
                const badge = document.createElement("span");
                badge.className = "badge bg-danger rounded-pill ms-auto";
                badge.innerText = count > 99 ? "99+" : count;
                // In the sidebar, the icon is <i>, followed by text. We want the badge at the end.
                link.appendChild(badge);
            }
        });
    } catch (error) {
        console.error("Error updating unread badge:", error);
    }
}
