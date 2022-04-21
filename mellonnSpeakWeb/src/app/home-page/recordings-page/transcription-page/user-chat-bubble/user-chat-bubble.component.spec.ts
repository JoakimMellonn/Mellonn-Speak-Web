import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserChatBubbleComponent } from './user-chat-bubble.component';

describe('UserChatBubbleComponent', () => {
  let component: UserChatBubbleComponent;
  let fixture: ComponentFixture<UserChatBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserChatBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserChatBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
