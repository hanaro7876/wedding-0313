// 하객 사진·영상 업로드 → 내 구글 드라이브 폴더 (원본, 영상 포함)
// 사용법: script.google.com 새 프로젝트 → 이 코드 전체 붙여넣기 → 배포 → 새 배포 → 웹 앱
//        (실행: 나 / 액세스 권한: 모든 사용자) → 권한 승인 → 나온 URL을 classic.html의 UPLOAD_URL에 넣기
// 브라우저가 파일을 드라이브로 직접 올리고, 이 스크립트는 "업로드 허가 주소"만 만들어 줍니다.

const FOLDER_NAME = '은강 다인 본식 웨딩 사진';   // 없으면 자동으로 만들어짐
const SITE = 'https://hanaro7876.github.io';       // 청첩장 주소 (도메인 바꾸면 같이 수정)
const MAX_BYTES = 4 * 1024 * 1024 * 1024;         // 파일 하나 최대 4GB

function doPost(e) {
  const q = JSON.parse(e.postData.contents);
  const type = String(q.type || ''), size = Number(q.size);
  if (!/^(image|video)\//.test(type)) return out_({ error: '사진·영상만 올릴 수 있어요' });
  if (!(size > 0 && size <= MAX_BYTES)) return out_({ error: '파일이 너무 커요' });

  const who = String(q.who || '').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 20) || '하객';
  const name = Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd_HHmmss') + '_' + who + '_' + String(q.name || 'file').slice(-80);

  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': type,
      'X-Upload-Content-Length': String(size),
      Origin: SITE,
    },
    payload: JSON.stringify({ name: name, parents: [folderId_()] }),
    muteHttpExceptions: true,
  });
  const h = res.getHeaders();
  const url = h.Location || h.location;
  return out_(url ? { url: url } : { error: '업로드 준비 실패 (' + res.getResponseCode() + ')' });
}

function folderId_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('FOLDER_ID');
  if (id) return id;
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  id = (it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME)).getId();
  props.setProperty('FOLDER_ID', id);
  return id;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
