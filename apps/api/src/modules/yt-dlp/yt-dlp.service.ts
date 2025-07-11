import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { YtDlpRequest, YtDlpResponse } from '@reviewsup/api/yt-dlp';

@Injectable()
export class YtDlpService {
  private logger = new Logger('YtDlpService');

  constructor() {}

  async parse(request: YtDlpRequest): Promise<YtDlpResponse> {
    //check if the request is a valid URL
    if (!request.url || !request.url.startsWith('http')) {
      throw new Error('Invalid URL provided');
    }

    const res = await axios.post(
      // `${process.env.YT_DLP_SERVER_URL}/parse`,
      'https://yt-dlp.reviewsup.io/parse',
      request,
    );
    return {
      title: res.data.title,
      uploader: res.data.uploader,
      duration: res.data.duration,
      thumbnail: res.data.thumbnail,
      video_url: res.data.video_url,
    } as YtDlpResponse;
  }
}
