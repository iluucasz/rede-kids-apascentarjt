type ShareLessonLinkInput = {
  lessonId: string;
  lessonTheme: string;
};

export async function shareLessonLink({
  lessonId,
  lessonTheme,
}: ShareLessonLinkInput) {
  const url = new URL(`/aulas/${lessonId}`, window.location.origin).toString();
  const shareData = {
    title: lessonTheme,
    text: `Aula: ${lessonTheme}`,
    url,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const canShare =
        typeof navigator.canShare === "function" ? navigator.canShare({ url }) : true;

      if (canShare) {
        await navigator.share(shareData);
        return "Link da aula pronto para compartilhar.";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "Compartilhamento cancelado.";
      }
    }
  }

  await copyTextToClipboard(url);
  return "Link da aula copiado. Você já pode compartilhar.";
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the manual copy fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error("Não foi possível compartilhar a aula.");
  }
}