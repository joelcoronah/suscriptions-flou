import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { pubSub } from '../app.module';

@Resolver()
export class DocumentResolver {
  private userConnections: Record<string, number> = {};

  @Query(() => String)
  hello(): string {
    return 'Welcome to Apollo Subscriptions Example';
  }

  @Mutation(() => Boolean)
  async updateDocument(
    @Args('documentId') documentId: string,
  ): Promise<boolean> {
    // Simular actualización y notificar
    if (this.userConnections[documentId]) {
      await pubSub.publish(`DOCUMENT_UPDATED_${documentId}`, {
        documentUpdates: `Document ${documentId} was updated.`,
      });
      return true;
    }
    return false;
  }

  @Subscription(() => String, {
    resolve: (payload) => payload.documentUpdates,
    filter: (payload, variables) =>
      payload.documentUpdates.startsWith(`Document ${variables.documentId}`),
  })
  documentUpdates(@Args('documentId') documentId: string) {
    if (!this.userConnections[documentId]) {
      this.userConnections[documentId] = 0;
    }
    this.userConnections[documentId] += 1;

    // Cleanup on disconnect
    return pubSub.asyncIterableIterator(`DOCUMENT_UPDATED_${documentId}`);
  }
}
