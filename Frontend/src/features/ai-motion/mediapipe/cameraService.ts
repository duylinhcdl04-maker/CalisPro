export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  public async startCamera(
    videoElement: HTMLVideoElement,
    options?: {
      facingMode?: 'user' | 'environment';
      idealWidth?: number;
      idealHeight?: number;
      deviceId?: string;
    }
  ): Promise<MediaStream> {
    this.stopCamera();
    this.videoElement = videoElement;

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: options?.facingMode || 'user',
        width: { ideal: options?.idealWidth || 1280 },
        height: { ideal: options?.idealHeight || 720 },
        deviceId: options?.deviceId ? { exact: options.deviceId } : undefined,
      },
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;

      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play().then(() => resolve()).catch(() => resolve());
        };
      });

      return this.stream;
    } catch (err: any) {
      console.error('[CameraService] Failed to start camera:', err);
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền Camera trên trình duyệt.'
          : err.name === 'NotFoundError'
          ? 'Không tìm thấy thiết bị Camera nào trên máy của bạn.'
          : 'Không thể mở Camera: ' + err.message
      );
    }
  }

  public stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  public async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  /** Luồng đang chạy, để ghi hình bài test (assessment-recording) mà không mở camera lần hai. */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  public isCameraRunning(): boolean {
    return !!this.stream && this.stream.active;
  }
}

export const cameraService = new CameraService();
