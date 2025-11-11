import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-fundstellen-download',
    templateUrl: './fundstellen-download.component.html',
    styleUrls: ['./fundstellen-download.component.scss'],
    standalone: false
})
export class FundstellenDownloadComponent implements OnInit {
  public fundstellenURL = '';
  public selectedLocation = '';

  constructor() {}

  ngOnInit(): void {}

  downloadFiles(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.selectedLocation = files[0].webkitRelativePath.split(files[0].name)[0];
    }

    if (!this.fundstellenURL || !this.selectedLocation) {
      console.error('URL and/or download location not provided.');
      return;
    }

    fetch(this.fundstellenURL)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        const fileUrls: string[] = [];

        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href) {
            fileUrls.push(href);
          }
        });

        this.downloadFileSequentially(fileUrls);
      })
      .catch((error) => console.error('Error fetching URL:', error));
  }

  downloadFileSequentially(urls: string[]) {
    const downloadNext = (index: number) => {
      if (index < urls.length) {
        this.downloadFile(urls[index])
          .then(() => downloadNext(index + 1))
          .catch((error) => {
            console.error('Error downloading file:', error);
            // If an error occurs, skip to the next file
            downloadNext(index + 1);
          });
      }
    };

    // Start downloading files sequentially
    downloadNext(0);
  }

  downloadFile(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const filename = url.split('/').pop() || 'file';
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          // Preselect the filename
          a.download = this.selectedLocation + '/' + filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
          resolve();
        })
        .catch((error) => reject(error));
    });
  }
}
