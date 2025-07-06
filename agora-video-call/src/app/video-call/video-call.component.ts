import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IVirtualBackgroundExtension } from 'agora-extension-virtual-background';

import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule], // <-- Add this line
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css'],
})
export class VideoCallComponent implements OnInit, OnDestroy {
  private client: IAgoraRTCClient;
  private localAudioTrack?: ILocalAudioTrack;
  private localVideoTrack?: ILocalVideoTrack;
  remoteUsers: {
    [uid: string]: {
      videoTrack?: IRemoteVideoTrack;
      audioTrack?: IRemoteAudioTrack;
    };
  } = {};
  appId = 'c40a26db08dc40d8a564e347e6dfe8a1'; // TODO: Replace with your Agora App ID
  channel = 'test';
  token: string =
    '007eJxTYKi93Be3mXWyz7qN94KevedZqeshP6OxgeOAwfQZkZHMj1QVGIxNTUwSk01NkiyN00zMkpMTU01TDRNTDNJSTU2NEi1N3s/PymgIZGRgqk9lYIRCEJ+FoSS1uISBAQA54R8L'; // Use a token if your project requires it
  uid: UID | null = null;

  constructor() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }

  async ngOnInit() {
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        this.remoteUsers[user.uid] = this.remoteUsers[user.uid] || {};
        this.remoteUsers[user.uid].videoTrack = user.videoTrack;
        user.videoTrack?.play(`remote-video-${user.uid}`);
      }
      if (mediaType === 'audio') {
        this.remoteUsers[user.uid] = this.remoteUsers[user.uid] || {};
        this.remoteUsers[user.uid].audioTrack = user.audioTrack;
        user.audioTrack?.play();
      }
    });
    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        delete this.remoteUsers[user.uid]?.videoTrack;
      }
      if (mediaType === 'audio') {
        delete this.remoteUsers[user.uid]?.audioTrack;
      }
    });
    const vbExtension = (AgoraRTC as any).EXTENSIONS?.['virtual-background'];
    if (vbExtension) {
      AgoraRTC.registerExtensions([vbExtension as IVirtualBackgroundExtension]);
    }
  }

  async join() {
    this.uid = await this.client.join(
      this.appId,
      this.channel,
      this.token || null,
      null
    );
    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    this.localVideoTrack.play('local-video');
    await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
  }

  async leave() {
    await this.client.leave();
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    this.localAudioTrack = undefined;
    this.localVideoTrack = undefined;
    this.uid = null;
    this.remoteUsers = {};
  }

  ngOnDestroy() {
    this.leave();
  }
}
