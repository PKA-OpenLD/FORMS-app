#!/usr/bin/env bun
/*
 * Copyright 2025 PKA-OpenLD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import bcrypt from 'bcryptjs';
import { getDatabase } from '../lib/mongodb';

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');
    
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...');
      
      const hashedPassword = await bcrypt.hash('123123', 10);
      await usersCollection.updateOne(
        { username: 'admin' },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('➕ Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash('123123', 10);
      const now = new Date();
      
      await usersCollection.insertOne({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n📋 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: 123123');
    console.log('\n⚠️  Please change this password after first login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
