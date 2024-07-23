import axios from 'axios';

async function fetchDataWithIfModifiedSince(url, lastModifiedDate) {
  try {
    const response = await axios.get(url, {
      headers: {
        'If-Modified-Since': lastModifiedDate
      }
    });

    // 데이터를 성공적으로 가져왔을 경우
    console.log('Data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    // 요청이 실패했거나 리소스가 수정되지 않은 경우
    if (error.response && error.response.status === 304) {
      console.log('Resource not modified since:', lastModifiedDate);
    } else {
      // 다른 에러 처리
      console.error('Failed to fetch data:', error);
    }
  }
}

// 예제 사용
const url = 'http://example.com/resource'; // 서버의 리소스 URL
const lastModifiedDate = 'Wed, 21 Oct 2015 07:28:00 GMT'; // 예시 날짜, RFC 2822 혹은 ISO 8601 형식

fetchDataWithIfModifiedSince(url, lastModifiedDate);
