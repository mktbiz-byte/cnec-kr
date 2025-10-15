#!/usr/bin/env python3

"""
cnec.jp 계정 마이그레이션 스크립트
작성일: 2025-10-15

이 스크립트는 기존 사용자 계정을 새로운 인증 시스템으로 마이그레이션합니다.
"""

import os
import sys
import csv
import json
import uuid
import argparse
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import requests

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("migration.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("migration")

# 환경 변수 또는 설정 파일에서 데이터베이스 연결 정보 로드
def load_config():
    """설정 파일 또는 환경 변수에서 설정 로드"""
    config = {
        "source_db": {
            "host": os.getenv("SOURCE_DB_HOST", "localhost"),
            "port": os.getenv("SOURCE_DB_PORT", "5432"),
            "database": os.getenv("SOURCE_DB_NAME", "cnec_old"),
            "user": os.getenv("SOURCE_DB_USER", "postgres"),
            "password": os.getenv("SOURCE_DB_PASSWORD", "")
        },
        "target_db": {
            "host": os.getenv("TARGET_DB_HOST", "localhost"),
            "port": os.getenv("TARGET_DB_PORT", "5432"),
            "database": os.getenv("TARGET_DB_NAME", "cnec_new"),
            "user": os.getenv("TARGET_DB_USER", "postgres"),
            "password": os.getenv("TARGET_DB_PASSWORD", "")
        },
        "supabase": {
            "url": os.getenv("SUPABASE_URL", ""),
            "key": os.getenv("SUPABASE_KEY", "")
        },
        "export_dir": os.getenv("EXPORT_DIR", "/tmp"),
        "send_emails": os.getenv("SEND_EMAILS", "false").lower() == "true"
    }
    return config

# 데이터베이스 연결
def connect_db(db_config):
    """데이터베이스 연결"""
    try:
        conn = psycopg2.connect(
            host=db_config["host"],
            port=db_config["port"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"]
        )
        return conn
    except Exception as e:
        logger.error(f"데이터베이스 연결 오류: {e}")
        sys.exit(1)

# 기존 사용자 데이터 추출
def extract_users(conn):
    """기존 사용자 데이터 추출"""
    logger.info("사용자 데이터 추출 중...")
    users = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    id, 
                    email, 
                    password_hash,
                    role, 
                    created_at, 
                    updated_at
                FROM users
            """)
            users = cur.fetchall()
        logger.info(f"{len(users)}명의 사용자 데이터 추출 완료")
        return users
    except Exception as e:
        logger.error(f"사용자 데이터 추출 오류: {e}")
        return []

# 기존 기업 데이터 추출
def extract_companies(conn):
    """기존 기업 데이터 추출"""
    logger.info("기업 데이터 추출 중...")
    companies = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    id, 
                    user_id, 
                    name AS company_name, 
                    business_number, 
                    address, 
                    phone, 
                    created_at, 
                    updated_at
                FROM companies
            """)
            companies = cur.fetchall()
        logger.info(f"{len(companies)}개의 기업 데이터 추출 완료")
        return companies
    except Exception as e:
        logger.error(f"기업 데이터 추출 오류: {e}")
        return []

# 데이터 변환
def transform_data(users, companies):
    """데이터 변환"""
    logger.info("데이터 변환 중...")
    
    # 사용자 데이터 변환
    transformed_users = []
    for user in users:
        transformed_users.append({
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'user_metadata': json.dumps({
                'role': user['role'],
                'migrated_at': datetime.now().isoformat()
            }),
            'created_at': user['created_at'].isoformat() if user['created_at'] else datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
    
    # 기업 데이터 변환
    transformed_companies = []
    for company in companies:
        transformed_companies.append({
            'id': str(uuid.uuid4()),
            'old_id': company['id'],
            'auth_user_id': company['user_id'],
            'company_name': company['company_name'],
            'business_number': company['business_number'],
            'address': company['address'] if company['address'] else '',
            'phone': company['phone'] if company['phone'] else '',
            'is_verified': True,
            'created_at': company['created_at'].isoformat() if company['created_at'] else datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
    
    logger.info("데이터 변환 완료")
    return transformed_users, transformed_companies

# CSV 파일로 내보내기
def export_to_csv(data, filename, export_dir):
    """데이터를 CSV 파일로 내보내기"""
    if not data:
        logger.warning(f"내보낼 데이터가 없습니다: {filename}")
        return
    
    filepath = os.path.join(export_dir, filename)
    try:
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        logger.info(f"데이터를 {filepath}로 내보내기 완료")
    except Exception as e:
        logger.error(f"CSV 내보내기 오류: {e}")

# 데이터 가져오기
def import_data(conn, users, companies):
    """변환된 데이터를 새 데이터베이스로 가져오기"""
    logger.info("데이터 가져오기 중...")
    try:
        with conn.cursor() as cur:
            # 트랜잭션 시작
            conn.autocommit = False
            
            # 사용자 데이터 가져오기
            logger.info("사용자 데이터 가져오기 중...")
            for user in users:
                cur.execute("""
                    INSERT INTO auth.users (
                        id, 
                        email,
                        email_confirmed_at,
                        created_at, 
                        updated_at,
                        user_metadata
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    user['id'],
                    user['email'],
                    datetime.now(),
                    user['created_at'],
                    user['updated_at'],
                    user['user_metadata']
                ))
            
            # 기업 계정 데이터 가져오기
            logger.info("기업 계정 데이터 가져오기 중...")
            for company in companies:
                cur.execute("""
                    INSERT INTO corporate_accounts (
                        id,
                        auth_user_id,
                        company_name,
                        business_number,
                        address,
                        phone,
                        is_verified,
                        created_at,
                        updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    company['id'],
                    company['auth_user_id'],
                    company['company_name'],
                    company['business_number'],
                    company['address'],
                    company['phone'],
                    company['is_verified'],
                    company['created_at'],
                    company['updated_at']
                ))
                
                # 매핑 테이블에 기록
                cur.execute("""
                    INSERT INTO migration_mappings (old_id, new_id, entity_type)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (old_id, entity_type) DO NOTHING
                """, (
                    company['old_id'],
                    company['id'],
                    'company'
                ))
            
            # 트랜잭션 커밋
            conn.commit()
            logger.info("데이터 가져오기 완료")
    except Exception as e:
        conn.rollback()
        logger.error(f"데이터 가져오기 오류: {e}")
        raise
    finally:
        conn.autocommit = True

# 비밀번호 재설정 이메일 발송
def send_password_reset_emails(users, supabase_config):
    """사용자에게 비밀번호 재설정 이메일 발송"""
    if not supabase_config["url"] or not supabase_config["key"]:
        logger.warning("Supabase 설정이 없어 비밀번호 재설정 이메일을 발송할 수 없습니다.")
        return
    
    logger.info("비밀번호 재설정 이메일 발송 중...")
    success_count = 0
    error_count = 0
    
    for user in users:
        try:
            response = requests.post(
                f"{supabase_config['url']}/auth/v1/recover",
                headers={
                    "apikey": supabase_config["key"],
                    "Content-Type": "application/json"
                },
                json={"email": user["email"]}
            )
            
            if response.status_code == 200:
                success_count += 1
            else:
                error_count += 1
                logger.error(f"이메일 발송 실패 ({user['email']}): {response.text}")
        except Exception as e:
            error_count += 1
            logger.error(f"이메일 발송 오류 ({user['email']}): {e}")
    
    logger.info(f"비밀번호 재설정 이메일 발송 완료: 성공 {success_count}건, 실패 {error_count}건")

# 마이그레이션 검증
def validate_migration(source_conn, target_conn):
    """마이그레이션 결과 검증"""
    logger.info("마이그레이션 검증 중...")
    
    # 사용자 수 확인
    with source_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM users")
        source_user_count = cur.fetchone()[0]
    
    with target_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM auth.users")
        target_user_count = cur.fetchone()[0]
    
    if source_user_count != target_user_count:
        logger.warning(f"사용자 수 불일치: 원본 {source_user_count}명, 대상 {target_user_count}명")
    else:
        logger.info(f"사용자 수 일치: {source_user_count}명")
    
    # 기업 수 확인
    with source_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM companies")
        source_company_count = cur.fetchone()[0]
    
    with target_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM corporate_accounts")
        target_company_count = cur.fetchone()[0]
    
    if source_company_count != target_company_count:
        logger.warning(f"기업 수 불일치: 원본 {source_company_count}개, 대상 {target_company_count}개")
    else:
        logger.info(f"기업 수 일치: {source_company_count}개")
    
    # 무작위 샘플 검증 (추가 구현 필요)
    
    logger.info("마이그레이션 검증 완료")

# 메인 함수
def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='cnec.jp 계정 마이그레이션 스크립트')
    parser.add_argument('--dry-run', action='store_true', help='실제 가져오기 없이 추출 및 변환만 수행')
    parser.add_argument('--validate', action='store_true', help='마이그레이션 후 검증 수행')
    parser.add_argument('--send-emails', action='store_true', help='비밀번호 재설정 이메일 발송')
    args = parser.parse_args()
    
    # 설정 로드
    config = load_config()
    if args.send_emails:
        config["send_emails"] = True
    
    try:
        # 소스 데이터베이스 연결
        logger.info("소스 데이터베이스 연결 중...")
        source_conn = connect_db(config["source_db"])
        
        # 데이터 추출
        users = extract_users(source_conn)
        companies = extract_companies(source_conn)
        
        # 데이터 변환
        transformed_users, transformed_companies = transform_data(users, companies)
        
        # CSV 파일로 내보내기
        export_to_csv(transformed_users, "users_transformed.csv", config["export_dir"])
        export_to_csv(transformed_companies, "companies_transformed.csv", config["export_dir"])
        
        if not args.dry_run:
            # 대상 데이터베이스 연결
            logger.info("대상 데이터베이스 연결 중...")
            target_conn = connect_db(config["target_db"])
            
            # 데이터 가져오기
            import_data(target_conn, transformed_users, transformed_companies)
            
            # 비밀번호 재설정 이메일 발송
            if config["send_emails"]:
                send_password_reset_emails(users, config["supabase"])
            
            # 마이그레이션 검증
            if args.validate:
                validate_migration(source_conn, target_conn)
            
            # 연결 종료
            target_conn.close()
        
        # 소스 연결 종료
        source_conn.close()
        
        logger.info("마이그레이션 작업 완료")
    except Exception as e:
        logger.error(f"마이그레이션 중 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
