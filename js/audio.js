// 歌曲信息数组 - 总共4首歌
var musicList = [
    {
        title: "歌曲1",
        author: "陈冠锋"
    },
    {
        title: "歌曲2",
        author: "25216950227"
    },
    {
        title: "歌曲3",
        author: "陈冠锋"
    },
    {
        title: "歌曲4",
        author: "锋"
    }
];

var playPause = document.getElementById('playPause');
var audio = document.getElementById('audioTag');
var rotateImg = document.getElementsByClassName('record-img')[0];
var body = document.body;

// 获取进度条相关元素
var progressBar = document.querySelector('.progress');
var playedTime = document.querySelector('.played-time');
var audioTime = document.querySelector('.audio-time');
var volumnToggle = document.getElementById('volumn-togger');

// 获取歌曲名和作者元素
var musicTitleElement = document.querySelector('.music-title');
var authorNameElement = document.querySelector('.author-name');

// 获取播放模式元素
var playModeElement = document.getElementById('playMode');
// 获取音量图标元素
var volumnIconElement = document.getElementById('volumn');
// 获取列表按钮元素
var listBtn = document.getElementById('list');
// 获取列表容器元素
var musicContainer = document.querySelector('.music-container');
var musicId = 0;
var isPlaying = false;

// 播放模式：0-单曲循环，1-顺序播放，2-随机播放
var playMode = 1; // 默认顺序播放
// 是否静音
var isMuted = false;
// 存储之前的音量值（用于取消静音时恢复）
var previousVolume = 70; // 默认70%
// 是否显示列表
var isListVisible = false;

// 创建遮罩层
var musicOverlay = document.createElement('div');
musicOverlay.className = 'music-overlay';

// 初始化函数
function initializePlayer() {
    // 添加遮罩层到body
    document.body.appendChild(musicOverlay);

    // 初始化歌曲列表
    initMusicList();

    // 初始化音乐
    intMusic();

    // 初始化播放模式图标
    playModeElement.style.backgroundImage = `url('img/mode2.png')`; // 默认顺序播放

    // 初始化音量图标
    volumnIconElement.style.backgroundImage = `url('img/音量.png')`;

    // 初始化音量
    audio.volume = volumnToggle.value / 100;

    // 初始化进度条背景
    resetProgressBar();
}

// 音乐初始化
function intMusic() {
    // 获取当前歌曲信息
    var currentMusic = musicList[musicId];

    // 更新音频源
    audio.src = `./mp3/music${musicId}.mp3`;
    audio.load();

    // 更新页面显示
    rotateImg.style.backgroundImage = `url('img/record${musicId}.jpg')`;
    body.style.backgroundImage = `url('img/bg${musicId}.png')`;

    // 更新歌曲名和作者
    musicTitleElement.textContent = currentMusic.title;
    authorNameElement.textContent = currentMusic.author;

    // 刷新唱片旋转
    refreshRotate();

    // 更新总时长显示
    audio.onloadedmetadata = function () {
        updateTotalTime();
        resetProgressBar();

        // 如果是播放状态，自动开始播放
        if (isPlaying) {
            setTimeout(function () {
                audio.play().catch(function (error) {
                    console.error("播放失败:", error);
                });
            }, 100);
        }
    }

    // 处理加载错误
    audio.onerror = function () {
        console.error("音乐加载失败: " + audio.src);
    };

    // 更新列表中的当前播放标记
    updateMusicListHighlight();
}

//初始化歌曲列表
function initMusicList() {
    var musicLists = document.querySelector('.musiclists');
    var musicListTitle = document.querySelector('.musicList-title');

    // 创建列表头部
    var listHeader = document.createElement('div');
    listHeader.className = 'list-header';
    listHeader.innerHTML = `
        <h2>播放列表</h2>
        <button class="close-btn">&times;</button>
    `;

    // 清空容器内容
    musicContainer.innerHTML = '';

    // 添加头部
    musicContainer.appendChild(listHeader);

    // 添加列表容器
    var listContainer = document.createElement('div');
    listContainer.className = 'musiclists';
    musicContainer.appendChild(listContainer);

    // 为关闭按钮添加事件
    var closeBtn = listHeader.querySelector('.close-btn');
    closeBtn.addEventListener('click', function (e) {
        e.stopPropagation(); // 阻止事件冒泡
        hideMusicList();
    });

    // 为每首歌曲创建列表项
    musicList.forEach(function (music, index) {
        var musicItem = document.createElement('div');
        musicItem.className = 'music' + index;
        if (index === musicId) {
            musicItem.classList.add('current-playing');
        }
        musicItem.setAttribute('data-index', index + 1); // 添加序号

        musicItem.innerHTML = `
            <div class="playing-icon"></div>
            <div class="song-info">
                <div class="song-title">${music.title}</div>
                <div class="song-author">${music.author}</div>
            </div>
        `;

        // 点击歌曲项切换播放
        musicItem.addEventListener('click', function (e) {
            e.stopPropagation(); // 阻止事件冒泡
            var index = parseInt(this.className.replace('music', '')) || 0;
            switchToMusic(index);
        });

        listContainer.appendChild(musicItem);
    });

    // 阻止列表容器内的点击事件冒泡到列表容器本身
    musicContainer.addEventListener('click', function (e) {
        e.stopPropagation();
    });
}

//切换播放指定歌曲
function switchToMusic(index) {
    // 保存当前的播放状态
    var wasPlaying = !audio.paused;

    // 停止当前音乐
    audio.pause();
    stopProgressUpdate();

    // 更新当前歌曲ID
    musicId = index;

    // 重新初始化音乐
    intMusic();

    // 更新列表高亮
    updateMusicListHighlight();

    // 切换音乐后播放
    setTimeout(function () {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA 或更高
            audio.play().then(function () {
                rotateRecord();
                playPause.style.backgroundImage = `url('img/暂停.png')`;
                isPlaying = true;
                startProgressUpdate();
            }).catch(function (error) {
                console.error("播放失败:", error);
            });
        } else {
            // 如果还没加载好，等待加载完成
            audio.oncanplay = function () {
                audio.play().then(function () {
                    rotateRecord();
                    playPause.style.backgroundImage = `url('img/暂停.png')`;
                    isPlaying = true;
                    startProgressUpdate();
                    // 移除事件监听，避免重复执行
                    audio.oncanplay = null;
                }).catch(function (error) {
                    console.error("播放失败:", error);
                });
            };
        }
    }, 300);
}

//更新列表中的当前播放高亮
function updateMusicListHighlight() {
    var musicItems = document.querySelectorAll('.musiclists > div');
    musicItems.forEach(function (item, index) {
        if (index === musicId) {
            item.classList.add('current-playing');
        } else {
            item.classList.remove('current-playing');
        }
    });
}

//显示歌曲列表
function showMusicList() {
    musicContainer.classList.add('show');
    musicOverlay.classList.add('show');
    isListVisible = true;
    updateMusicListHighlight(); // 确保高亮正确
}

//隐藏歌曲列表
function hideMusicList() {
    musicContainer.classList.remove('show');
    musicOverlay.classList.remove('show');
    isListVisible = false;
}

// 点击播放音乐
playPause.addEventListener('click', function () {
    togglePlayPause();
})

// 切换播放/暂停状态

function togglePlayPause() {
    if (audio.paused) {
        audio.play().then(function () {
            rotateRecord();
            playPause.style.backgroundImage = `url('img/暂停.png')`;
            isPlaying = true;
            startProgressUpdate();
        }).catch(function (error) {
            console.error("播放失败:", error);
        });
    } else {
        audio.pause();
        rotateRecordStop();
        playPause.style.backgroundImage = `url('img/继续播放.png')`;
        isPlaying = false;
        stopProgressUpdate();
    }
}

// 唱片旋转
function rotateRecord() {
    if (!rotateImg.classList.contains('rotate-play')) {
        rotateImg.classList.add('rotate-play');
    }
    rotateImg.style.animationPlayState = 'running';
}

// 唱片暂停
function rotateRecordStop() {
    rotateImg.style.animationPlayState = 'paused';
}

// 刷新唱片角度
function refreshRotate() {
    rotateImg.classList.remove('rotate-play');
    void rotateImg.offsetWidth;
    rotateImg.classList.add('rotate-play');
}


// 格式化时间（秒 -> 分:秒）
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 更新总时长显示
function updateTotalTime() {
    const totalSeconds = audio.duration;
    audioTime.textContent = formatTime(totalSeconds);
}

// 重置进度条
function resetProgressBar() {
    // 使用CSS变量或直接设置伪元素的宽度
    progressBar.style.setProperty('--progress-width', '0%');
    // 或者使用渐变背景
    progressBar.style.background = `linear-gradient(to right, #1db954 0%, #dcdcdc 0%)`;
    playedTime.textContent = '00:00';
}

// 更新进度条 - 使用渐变背景
function updateProgressBar() {
    if (audio.duration && audio.currentTime) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        // 设置渐变背景：绿色部分表示已播放，灰色部分表示未播放
        progressBar.style.background = `linear-gradient(to right, #1db954 ${progressPercent}%, #dcdcdc ${progressPercent}%)`;
        playedTime.textContent = formatTime(audio.currentTime);
    }
}

// 定时器变量
var progressTimer;

// 开始更新进度
function startProgressUpdate() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(updateProgressBar, 100);
}

// 停止更新进度
function stopProgressUpdate() {
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
}

// 点击进度条跳转
progressBar.addEventListener('click', function (e) {
    if (!audio.duration) return;

    const rect = this.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;

    audio.currentTime = audio.duration * percentage;
    updateProgressBar();
});

// 播放模式切换功能
playModeElement.addEventListener('click', function () {
    // 切换播放模式
    playMode = (playMode + 1) % 3; // 0->1->2->0循环

    // 根据播放模式更新图标
    switch (playMode) {
        case 0: // 单曲循环
            playModeElement.style.backgroundImage = `url('img/mode1.png')`;
            console.log("播放模式: 单曲循环");
            break;
        case 1: // 顺序播放
            playModeElement.style.backgroundImage = `url('img/mode2.png')`;
            console.log("播放模式: 顺序播放");
            break;
        case 2: // 随机播放
            playModeElement.style.backgroundImage = `url('img/mode3.png')`;
            console.log("播放模式: 随机播放");
            break;
    }
});

// 根据播放模式获取下一首歌的ID
function getNextMusicId() {
    switch (playMode) {
        case 0: // 单曲循环 - 返回当前歌曲ID
            return musicId;
        case 1: // 顺序播放 - 顺序下一首
            return (musicId + 1) % musicList.length;
        case 2: // 随机播放 - 随机一首（不重复当前）
            let randomId;
            do {
                randomId = Math.floor(Math.random() * musicList.length);
            } while (randomId === musicId && musicList.length > 1);
            return randomId;
        default:
            return (musicId + 1) % musicList.length;
    }
}

// 静音功能
volumnIconElement.addEventListener('click', function () {
    if (isMuted) {
        // 取消静音
        isMuted = false;
        audio.volume = previousVolume / 100;
        volumnToggle.value = previousVolume;
        volumnIconElement.style.backgroundImage = `url('img/音量.png')`;
        console.log("取消静音，音量恢复为: " + previousVolume + "%");
    } else {
        // 静音
        isMuted = true;
        previousVolume = volumnToggle.value; // 保存当前音量
        audio.volume = 0;
        volumnToggle.value = 0;
        volumnIconElement.style.backgroundImage = `url('img/静音.png')`;
        console.log("静音");
    }
});

// 修改音频播放结束事件，根据播放模式处理
audio.addEventListener('ended', function () {
    playPause.style.backgroundImage = `url('img/继续播放.png')`;
    rotateRecordStop();
    isPlaying = false;
    stopProgressUpdate();

    // 根据播放模式决定下一首歌
    if (playMode === 0) {
        // 单曲循环 - 重新播放当前歌曲
        resetProgressBar();
        setTimeout(function () {
            audio.currentTime = 0;
            audio.play().then(function () {
                rotateRecord();
                playPause.style.backgroundImage = `url('img/暂停.png')`;
                isPlaying = true;
                startProgressUpdate();
            });
        }, 500);
    } else {
        // 顺序播放或随机播放 - 播放下一首
        resetProgressBar();

        // 获取下一首歌ID
        musicId = getNextMusicId();

        // 切换音乐
        setTimeout(function () {
            switchMusic();
        }, 500);
    }
});

// 音频时间更新事件
audio.addEventListener('timeupdate', function () {
    updateProgressBar();
});

// 音量控制
volumnToggle.addEventListener('input', function () {
    audio.volume = this.value / 100;

    // 如果音量大于0且当前是静音状态，取消静音
    if (this.value > 0 && isMuted) {
        isMuted = false;
        volumnIconElement.style.backgroundImage = `url('img/音量.png')`;
    }

    // 如果音量为0且当前不是静音状态，切换到静音状态
    if (this.value == 0 && !isMuted) {
        isMuted = true;
        volumnIconElement.style.backgroundImage = `url('img/静音.png')`;
    }
});

// 添加上一首/下一首功能（支持循环）
document.getElementById('before-music').addEventListener('click', function () {
    // 如果是随机播放模式，获取随机上一首
    if (playMode === 2) {
        let randomId;
        do {
            randomId = Math.floor(Math.random() * musicList.length);
        } while (randomId === musicId && musicList.length > 1);
        musicId = randomId;
    } else {
        // 如果是第一首歌，跳到最后一首
        if (musicId === 0) {
            musicId = musicList.length - 1; // 最后一首的索引
        } else {
            musicId--;
        }
    }
    switchMusic();
});

document.getElementById('last-music').addEventListener('click', function () {
    // 获取下一首歌ID（根据播放模式）
    musicId = getNextMusicId();
    switchMusic();
});

// 切换音乐函数
function switchMusic() {
    // 保存当前的播放状态
    var wasPlaying = !audio.paused;

    // 停止当前音乐
    audio.pause();
    stopProgressUpdate();

    // 重新初始化音乐
    intMusic();

    // 切换音乐后总是播放
    setTimeout(function () {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA 或更高
            audio.play().then(function () {
                rotateRecord();
                playPause.style.backgroundImage = `url('img/暂停.png')`;
                isPlaying = true;
                startProgressUpdate();
            }).catch(function (error) {
                console.error("播放失败:", error);
            });
        } else {
            // 如果还没加载好，等待加载完成
            audio.oncanplay = function () {
                audio.play().then(function () {
                    rotateRecord();
                    playPause.style.backgroundImage = `url('img/暂停.png')`;
                    isPlaying = true;
                    startProgressUpdate();
                    // 移除事件监听，避免重复执行
                    audio.oncanplay = null;
                }).catch(function (error) {
                    console.error("播放失败:", error);
                });
            };
        }
    }, 300); // 给加载一点时间
}

// 倍速功能
document.getElementById('speed').addEventListener('click', function () {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    let currentSpeed = audio.playbackRate;
    let nextIndex = speeds.indexOf(currentSpeed) + 1;

    if (nextIndex >= speeds.length) {
        nextIndex = 0;
    }

    audio.playbackRate = speeds[nextIndex];
    this.textContent = speeds[nextIndex].toFixed(1) + 'X';
});

listBtn.addEventListener('click', function () {
    if (!isListVisible) {
        showMusicList();
    }
});


musicOverlay.addEventListener('click', function () {
    hideMusicList();
});

document.addEventListener('DOMContentLoaded', function () {
    initializePlayer();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}