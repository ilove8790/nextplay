"""Git Tag에서 버전을 확인하고 버전 파일을 기록한다.
버전 파일 생성 방법(파일명: matool.version 고정)

<250923 개정>
- 태그 유무에 관계없이 major.minor.today로 기록
- 최종 태그는 버전파일에 기록된 기준으로 직접 수기 생성한다.

<250911 개정>
- 태그가 있으면 tag에 기록된 버전 숫자(x.xx.yymmdd)를 버전 파일에 기록
- 태그가 없으면 현재 버전과 브랜치 버전의 두자리가 큰 것으로 파일에 기록
  (즉, 두자리 같으면 기존 파일 유지, 날짜 추가 안함)

<260114 개정>
- 태그가 있으면 tag에 기록된 버전 숫자(x.xx.yymmdd)를 버전 파일에 기록
- 태그가 없으면 현재 버전과 브랜치 버전의 두자리가 큰 것으로 파일에 기록
  (즉, 두자리 같으면 기존 파일 유지, 날짜 추가 안함)
"""

import os
import subprocess
from datetime import datetime

TODAY_STRING = datetime.today().strftime("%y%m%d")

# 현재 스크립트가 있는 폴더명을 프로젝트명으로 사용
project_name = os.path.basename(os.path.dirname(os.path.abspath(__file__)))
VERSION_FILE = f"{project_name}.version"


def run_git(cmd):
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()

    except Exception:
        return None


def get_tag_for_current_commit():
    tag = run_git(["git", "tag", "--points-at", "HEAD"])
    return tag if tag else None


def get_version_string():
    # tag 읽어오기
    tag = get_tag_for_current_commit()
    if tag:
        # 태그 형식이 메이저.마이너.날짜6자리(예: 1.0.250114) 또는 그 뒤에 추가 숫자가 있는 경우 확인
        tag_parts = tag.split(".")
        if len(tag_parts) >= 3 and all(p.isdigit() for p in tag_parts[:3]) and len(tag_parts[2]) == 6:
            # return ".".join(tag_parts[:3])
            return tag

        # 태그 형식이 메이저.마이너.날짜6자리(예: 1.0.250114)가 아니면 그대로 사용
        return tag

    # branch 읽어오기
    branch = run_git(["git", "rev-parse", "--abbrev-ref", "HEAD"]) or "unknown"
    branch_parts = branch.split(".")

    # 브랜치 이름이 "major.minor..." 형식이면, "major.minor"에 오늘 날짜 추가
    if len(branch_parts) >= 2 and all(x.isdigit() for x in branch_parts[:2]):
        # f-string 내부 따옴표 충돌 방지를 위해 작은따옴표 사용
        return f"{'.'.join(branch_parts[:2])}.{TODAY_STRING}"

    # 숫자버전이 아니면 그대로 사용
    return branch


def write_version_string(filepath):
    version_string = get_version_string()

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"{version_string}\n")


if __name__ == "__main__":
    write_version_string(VERSION_FILE)
