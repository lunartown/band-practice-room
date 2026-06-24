import { Share } from '@capacitor/share';

// 네이티브 공유 시트로 합주실을 공유한다(카톡·메시지 등으로 친구에게 바로 전달).
// 웹뷰가 아닌 OS 공유 UI를 띄우는 전형적 네이티브 동작이다.
// 미지원 환경(일부 데스크톱 브라우저)에서는 조용히 무시한다.
export async function shareStudio(name: string, url: string | null): Promise<void> {
  try {
    await Share.share({
      title: name,
      text: `${name} 합주실 예약 가능 시간 확인해보세요`,
      url: url ?? undefined,
      dialogTitle: '합주실 공유',
    });
  } catch {
    /* 사용자가 취소했거나 공유 미지원 — 무시 */
  }
}

// 공유 가능 여부(데스크톱 일부 브라우저는 미지원). 버튼 노출 판단에 쓴다.
export async function canShare(): Promise<boolean> {
  try {
    const { value } = await Share.canShare();
    return value;
  } catch {
    return false;
  }
}
